import { Component, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiagnosticService, Vehicle, ChatMessage } from '../../services/diagnostic.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant.component.html',
  styleUrls: ['./assistant.component.css']
})
export class AssistantComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesScroll') private messagesScrollContainer!: ElementRef;

  private diagnosticService = inject(DiagnosticService);
  private router = inject(Router);

  vehicle: Vehicle | null = null;
  messages: ChatMessage[] = [];
  userInput = '';
  isThinking = false;
  showSettings = false;

  // Configuration IA
  customApiKey = '';
  selectedProvider: 'groq' | 'deepseek' | 'openrouter' | 'openai' | 'local' = 'groq';
  activeModelLabel = 'Groq (DeepSeek-R1 Gratuit)';

  // Suggestions rapides
  quickPrompts = [
    'Combien coûte le remplacement de la courroie ?',
    'Mon voyant moteur clignote, est-ce dangereux ?',
    'Pourquoi ma pédale de frein est-elle molle ?',
    'Quelle huile moteur utiliser pour ma vidange ?',
    'Le démarreur tourne mais le moteur ne démarre pas'
  ];

  ngOnInit(): void {
    // 1. Charger les clés sauvegardées dans le navigateur
    const savedKey = localStorage.getItem('autodiag_ai_key');
    this.customApiKey = savedKey || 'GROQ_API_KEY_PLACEHOLDER';
    if (!savedKey) {
      localStorage.setItem('autodiag_ai_key', this.customApiKey);
    }

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
      },
      error: () => {
        this.initWelcomeMessage();
      }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesScrollContainer) {
        this.messagesScrollContainer.nativeElement.scrollTop = this.messagesScrollContainer.nativeElement.scrollHeight;
      }
    } catch (_) {}
  }

  private initWelcomeMessage(): void {
    const vehName = this.vehicle ? `${this.vehicle.brand} ${this.vehicle.model} (${this.vehicle.engine || ''})` : 'votre voiture';
    const mileage = this.vehicle?.mileage ? Number(this.vehicle.mileage).toLocaleString('fr-FR') + ' km' : '';

    this.messages = [
      {
        role: 'assistant',
        content: `Bonjour ! Je suis **AutoDiag Copilote**, votre mécanicien virtuel intelligent.\n\nJe suis connecté à **Groq Cloud (LLM 120B / DeepSeek)** et configuré pour répondre précisément aux spécificités de votre **${vehName}**${mileage ? ' (' + mileage + ')' : ''}.\n\nPosez-moi n'importe quelle question sur vos pannes, voyants, révisions, bruits suspects ou tarifs d'atelier !`,
        timestamp: new Date(),
        provider: this.activeModelLabel
      }
    ];
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
    this.userInput = prompt;
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
      provider: this.selectedProvider
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
    // Format bold **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Format bullet lines - item
    formatted = formatted.replace(/^-\s+(.*)$/gm, '<li class="chat-li">$1</li>');
    // Format newlines
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  goToDiagnosis(): void {
    this.router.navigate(['/diagnostic', 1]);
  }
}
