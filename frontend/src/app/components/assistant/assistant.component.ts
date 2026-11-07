import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DiagnosticService, Vehicle, ChatMessage } from '../../services/diagnostic.service';
import { VehicleLogoService } from '../../services/vehicle-logo.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.css']
})
export class AssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesScroll') private messagesScrollContainer!: ElementRef;

  private diagnosticService = inject(DiagnosticService);
  private vehicleLogoService = inject(VehicleLogoService);
  translationService = inject(TranslationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  constructor() {
    effect(() => {
      // Whenever language changes and chat has only welcome message, update it
      const _ = this.translationService.currentLang();
      if (this.messages.length <= 1) {
        this.initWelcomeMessage();
      }
    });
  }

  vehicle: Vehicle | null = null;
  messages: ChatMessage[] = [];
  userInput = '';
  isThinking = false;
  showSettings = false;

  private lastMessageCount = 0;
  private lastThinkingState = false;
  private formattedContentCache = new Map<string, string>();

  // Configuration IA
  customApiKey = '';
  selectedProvider: 'groq' | 'deepseek' | 'openrouter' | 'openai' | 'local' = 'groq';
  activeModelLabel = 'Groq (DeepSeek-R1 Gratuit)';

  copiedIndex: number | null = null;

  // Suggestions rapides d'exemples simples
  quickPrompts = [
    { label: 'Pédale de frein molle', icon: '🛑' },
    { label: 'Voyant moteur allumé', icon: '⚠️' },
    { label: 'Bruit anormal au démarrage', icon: '⚙️' }
  ];

  getBrandLogoUrl(brand: string | undefined): string {
    return this.vehicleLogoService.getLogoUrl(brand);
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/simple-car.svg';
  }

  ngOnInit(): void {
    // 1. Charger les clés optionnelles personnalisées configurées par l'utilisateur
    const savedKey = localStorage.getItem('autodiag_ai_key');
    this.customApiKey = savedKey || '';

    const savedProvider = localStorage.getItem('autodiag_ai_provider') as any;
    if (savedProvider) this.selectedProvider = savedProvider;
    this.updateModelLabel();

    // 2. Charger le véhicule actif
    this.diagnosticService.getVehicles().subscribe({
      next: (vehicles) => {
        if (vehicles && vehicles.length > 0) {
          const primary = vehicles.find(v => v.is_primary) || vehicles[0];
          this.vehicle = primary;
        }
        this.initWelcomeMessage();
        this.checkInitialPrompt();
      },
      error: () => {
        this.initWelcomeMessage();
        this.checkInitialPrompt();
      }
    });
  }

  private checkInitialPrompt(): void {
    const promptParam = this.route.snapshot.queryParams['prompt'];
    if (promptParam && promptParam.trim()) {
      setTimeout(() => {
        this.userInput = promptParam.trim();
        this.sendMessage();
      }, 300);
    }
  }

  ngAfterViewChecked(): void {
    if (this.messages.length !== this.lastMessageCount || this.isThinking !== this.lastThinkingState) {
      this.lastMessageCount = this.messages.length;
      this.lastThinkingState = this.isThinking;
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesScrollContainer) {
        this.messagesScrollContainer.nativeElement.scrollTop = this.messagesScrollContainer.nativeElement.scrollHeight;
      }
    } catch (_) {}
  }

  initWelcomeMessage(): void {
    this.messages = [
      {
        role: 'assistant',
        content: this.translationService.t('assistant.welcome'),
        timestamp: new Date()
      }
    ];
  }

  copyMessage(content: string, index: number): void {
    if (!content) return;
    const clean = content.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^-\s+/gm, '• ');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(clean).then(() => {
        this.copiedIndex = index;
        setTimeout(() => {
          if (this.copiedIndex === index) this.copiedIndex = null;
        }, 2000);
      }).catch(() => {});
    }
  }

  clearChat(): void {
    if (this.messages.length <= 1) return;
    if (confirm('Réinitialiser la conversation avec AutoDiag IA ?')) {
      this.initWelcomeMessage();
    }
  }

  saveSettings(): void {
    localStorage.setItem('autodiag_ai_key', this.customApiKey.trim());
    localStorage.setItem('autodiag_ai_provider', this.selectedProvider);
    this.updateModelLabel();
    this.showSettings = false;
  }

  updateModelLabel(): void {
    switch (this.selectedProvider) {
      case 'groq':
        this.activeModelLabel = 'Groq Cloud (LLM 120B / DeepSeek Gratuit)';
        break;
      case 'deepseek':
        this.activeModelLabel = 'DeepSeek API Officielle';
        break;
      case 'openrouter':
        this.activeModelLabel = 'OpenRouter (DeepSeek R1 Free)';
        break;
      case 'openai':
        this.activeModelLabel = 'OpenAI (GPT-4o-mini)';
        break;
      case 'local':
        this.activeModelLabel = 'IA Locale Qwen2.5 (100% Hors-Ligne)';
        break;
    }
  }

  selectQuickPrompt(prompt: string): void {
    this.userInput = this.translationService.t(prompt);
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isThinking) return;

    // 1. Ajouter le message utilisateur
    this.messages.push({
      role: 'user',
      content: text,
      timestamp: new Date()
    });
    this.userInput = '';
    this.isThinking = true;

    // 2. Préparer l'historique
    const history = this.messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content
    }));

    // 3. Appel de l'API
    this.diagnosticService.chatWithAssistant({
      message: text,
      vehicle: this.vehicle,
      history,
      api_key: this.customApiKey.trim() || null,
      provider: this.selectedProvider,
      language: this.translationService.currentLang()
    }).subscribe({
      next: (res) => {
        this.isThinking = false;
        this.messages.push({
          role: 'assistant',
          content: res.reply || 'Désolé, je n\'ai pas pu formuler de réponse.',
          timestamp: new Date(),
          provider: res.provider || this.activeModelLabel,
          model: res.model,
          db_context_applied: res.db_context_applied
        });
      },
      error: () => {
        this.isThinking = false;
        this.messages.push({
          role: 'assistant',
          content: '⚠️ Une erreur de connexion est survenue. Veuillez vérifier votre clé API ou réessayer.',
          timestamp: new Date(),
          provider: 'Erreur Système'
        });
      }
    });
  }

  formatContent(text: string): string {
    if (!text) return '';

    const cached = this.formattedContentCache.get(text);
    if (cached !== undefined) {
      return cached;
    }

    // 1. Protection contre les injections
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Sections Markdown (### Titre)
    html = html.replace(/###\s*(🔍|⚠️|🛠️|💡|💶)?\s*(.*?)(?=\n|$)/g, (_match, icon, title) => {
      const rawTitle = (title || '').trim();
      let iconSymbol = icon || '📋';
      let sectionClass = 'section-general';

      const lower = rawTitle.toLowerCase();
      if (lower.includes('analyse') || lower.includes('diagnostic')) {
        sectionClass = 'section-diag';
        iconSymbol = '🔍';
      } else if (lower.includes('urgence') || lower.includes('sécurité')) {
        sectionClass = 'section-safety';
        iconSymbol = '⚠️';
      } else if (lower.includes('causes')) {
        sectionClass = 'section-causes';
        iconSymbol = '🛠️';
      } else if (lower.includes('actions') || lower.includes('conseils')) {
        sectionClass = 'section-advice';
        iconSymbol = '💡';
      } else if (lower.includes('estimation') || lower.includes('chiffrée') || lower.includes('coût')) {
        sectionClass = 'section-cost';
        iconSymbol = '💶';
      }

      return `<div class="chat-section-header ${sectionClass}">
        <span class="chat-section-icon">${iconSymbol}</span>
        <span class="chat-section-title">${rawTitle}</span>
      </div>`;
    });

    // 3. Badges de gravité
    html = html.replace(/-\s*\*\*Gravité\s*:\*\*\s*(.*?)(?=\n|$)/gi, (_match, val) => {
      const v = (val || '').trim();
      let badgeClass = 'badge-gravity-medium';
      let badgeIcon = 'ℹ️';
      if (/critique|danger/i.test(v)) {
        badgeClass = 'badge-gravity-critical';
        badgeIcon = '🚨';
      } else if (/élevée|haute|important/i.test(v)) {
        badgeClass = 'badge-gravity-high';
        badgeIcon = '⚠️';
      } else if (/faible|mineur/i.test(v)) {
        badgeClass = 'badge-gravity-low';
        badgeIcon = '✅';
      }
      return `<div class="chat-badge-pill ${badgeClass}"><span class="badge-icon">${badgeIcon}</span><strong>Gravité :</strong>&nbsp;${v}</div>`;
    });

    // 4. Statut d'aptitude à rouler
    html = html.replace(/-\s*\*\*Peut-on rouler\s*:\*\*\s*(.*?)(?=\n|$)/gi, (_match, val) => {
      const v = (val || '').trim();
      let runClass = 'run-caution';
      if (/arrêt immédiat|ne pas rouler|interdit/i.test(v)) {
        runClass = 'run-stop';
      } else if (/oui sans danger|aucun risque/i.test(v)) {
        runClass = 'run-ok';
      }
      return `<div class="chat-run-status ${runClass}"><span class="run-dot"></span><strong>Peut-on rouler :</strong>&nbsp;${v}</div>`;
    });

    // 5. Carte highlight pour l'estimation chiffrée
    html = html.replace(/-\s*\*\*Fourchette moyenne constatée\s*:\*\*\s*(.*?)(?=\n|$)/gi, (_match, val) => {
      return `<div class="chat-cost-card"><div class="cost-header"><span class="cost-badge-icon">💶</span><span class="cost-tag">Estimation constatée d'atelier</span></div><div class="cost-val">${(val || '').trim()}</div></div>`;
    });

    // 6. Formatage des puces restantes (- item)
    html = html.replace(/^-\s+(.*?)$/gm, '<div class="chat-bullet-row"><span class="bullet-arrow">›</span><span class="bullet-text">$1</span></div>');

    // 7. Formatage du texte gras **texte**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 8. Formatage du code inline `code`
    html = html.replace(/`([^`]+)`/g, '<code class="chat-code">$1</code>');

    // 9. Sauts de ligne
    html = html.replace(/\n\s*\n/g, '<div class="chat-spacer"></div>');
    html = html.replace(/\n/g, '<br>');

    this.formattedContentCache.set(text, html);
    return html;
  }

  goToDiagnosis(): void {
    this.router.navigate(['/diagnostic', 1]);
  }
}
