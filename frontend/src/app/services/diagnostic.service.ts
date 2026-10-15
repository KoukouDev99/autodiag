import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, catchError, map } from 'rxjs';
import { CAR_CATALOG_DATA } from '../data/car-catalog.data';
import {
  DiagnosticItem,
  DIAGNOSTIC_DATABASE,
  getDiagnosticCategories,
  searchDiagnostics,
  getDiagnosticById,
  getDiagnosticsByCategory
} from '../data/diagnostic-database.data';
import { ObdPid, OBD_PIDS } from '../data/obd-pids.data';

export type {
  DiagnosticItem,
  ObdPid
};

export {
  DIAGNOSTIC_DATABASE,
  getDiagnosticCategories,
  searchDiagnostics,
  getDiagnosticById,
  getDiagnosticsByCategory,
  OBD_PIDS
};


export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  created_at?: string;
  vehicles_count?: number;
  diagnostics_count?: number;
}

export interface Vehicle {
  id: number;
  user_id: number;
  brand: string;
  model: string;
  year: number;
  fuel: string;
  engine: string;
  mileage: number;
  mileage_unit?: 'km' | 'mi';
  license_plate: string;
  plate_country?: string;
  is_primary: boolean;
}

export interface EngineSpecItem {
  id: number;
  automobile_id?: number;
  name: string;
  power_hp: string | null;
  power_kw: string | null;
  torque_nm: string | null;
  displacement: string | null;
  cylinders: string | null;
  fuel: string | null;
  gearbox: string | null;
  drive_type: string | null;
  top_speed: string | null;
  acceleration: string | null;
  dimensions: string | null;
  weight: string | null;
  tires: string | null;
}

export interface Symptom {
  id: number;
  code: string;
  label: string;
  category: string;
  icon: string;
  description: string;
  is_critical: boolean;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  title: string;
  subtitle: string;
  icon: string;
  is_default: boolean;
}

export interface Question {
  id: number;
  symptom_id: number;
  step_num: number;
  total_steps: number;
  category: string;
  title: string;
  description: string;
  warning_text: string;
  why_ask?: string;
  image_url?: string;
  reformulation?: string;
  test_action?: string;
  test_type?: string;
  options: QuestionOption[];
}

export interface Hypothesis {
  id: number;
  symptom_id: number;
  name: string;
  priority_badge: string;
  priority_label: string;
  order_index: number;
  description: string;
  gravity: string;
  check_action: string;
  check_type: string;
  cost_min: number;
  cost_max: number;
  cost_currency?: string;
  score?: number;
  confidence?: string;
  confidence_percent?: number;
  reasoning?: string[];
}

export interface DiagnosticResultsResponse {
  session: any;
  vehicle: Vehicle;
  symptom: { code: string; label: string };
  summary: { headline: string; detail: string };
  disclaimer: string;
  causes_count: number;
  hypotheses: Hypothesis[];
  top_hypothesis?: Hypothesis;
  output_level?: number; // 1: >85%, 2: 60-85%, 3: <60%
  level_title?: string;
  level_badge?: string;
  top_confidence?: number;
  confirmation_test?: {
    title: string;
    action: string;
    expected: string;
    tools: string;
  };
  garage_memo?: {
    headline: string;
    what_to_say: string;
    checklist: string[];
  };
  eliminated_hypotheses?: Hypothesis[];
  solution?: any;
  safety_alerts: Array<{ level: string; message: string }>;
  guide_id: number;
}

export interface RepairStep {
  id: number;
  guide_id: number;
  step_num: number;
  title: string;
  time_est: string;
  description: string;
  subtext: string;
  caution_warning: string;
  image_url: string;
}

export interface RepairGuide {
  id: number;
  hypothesis_id: number;
  hypothesis_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  title: string;
  subtitle: string;
  difficulty: string;
  est_time: string;
  total_steps: number;
  safety_warning: string;
  tools_needed: string[];
  steps: RepairStep[];
}

export interface RecentDiagnostic {
  id: number;
  status: string;
  summary_title: string;
  summary_desc: string;
  symptom_label: string;
  symptom_code: string;
  symptom_icon: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  created_at: string;
}

export interface DtcCode {
  id: number;
  code: string;
  type?: 'P' | 'C' | 'B' | 'U';
  system: string;
  subsystem?: string;
  is_generic?: boolean;
  title: string;
  description: string;
  base_description?: string;
  is_brand_specific_definition?: boolean;
  matched_manufacturer?: string;
  manufacturers?: string[];
  specific_definitions?: { [make: string]: string };
  possible_causes: string[];
  urgency: string;
  garage_advice: string;
  bilingual_title?: { en: string; de?: string };
  affected_components?: string[];
  symptoms?: string[];
  related_codes?: string[];
  repair_info?: {
    difficulty?: string;
    diy_possible?: boolean;
    cost_min_eur?: number;
    cost_max_eur?: number;
    hours_min?: number;
    hours_max?: number;
  };
  flags?: {
    mil?: boolean;
    emissions_relevant?: boolean;
    drive_cycle_required?: boolean;
    limp_mode_possible?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  currentUser = signal<UserProfile | null>(this.loadInitialUser());
  token = signal<string | null>(this.loadInitialToken());

  private loadInitialUser(): UserProfile | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem('autodiag_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Error reading stored user', e);
    }
    // Default demo user if none stored
    return {
      id: 1,
      name: 'Thomas',
      email: 'thomas@autodiag.fr',
      phone: '06 12 34 56 78',
      city: 'Paris',
      vehicles_count: 1,
      diagnostics_count: 6,
      created_at: '2026-10-10'
    };
  }

  private loadInitialToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('autodiag_token');
  }

  setCurrentUser(user: UserProfile | null, token?: string): void {
    this.currentUser.set(user);
    if (user) {
      localStorage.setItem('autodiag_user', JSON.stringify(user));
      if (token) {
        localStorage.setItem('autodiag_token', token);
        this.token.set(token);
      }
    } else {
      localStorage.removeItem('autodiag_user');
      localStorage.removeItem('autodiag_token');
      this.token.set(null);
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.setCurrentUser(res.user, res.token);
        }
      })
    );
  }

  register(userData: { name: string; email: string; password: string; phone?: string; city?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData).pipe(
      tap(res => {
        if (res.success && res.user) {
          this.setCurrentUser(res.user, res.token);
        }
      })
    );
  }

  getProfile(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/profile/${userId}`).pipe(
      tap(profile => {
        if (profile) {
          const current = this.currentUser();
          this.setCurrentUser({ ...current, ...profile });
        }
      })
    );
  }

  updateProfile(userId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/profile/${userId}`, data).pipe(
      tap(res => {
        if (res.success && res.user) {
          const current = this.currentUser();
          this.setCurrentUser({ ...current, ...res.user });
        }
      })
    );
  }

  logout(): void {
    this.setCurrentUser(null);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user/current`);
  }

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`);
  }

  getVehicle(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.apiUrl}/vehicles/${id}`);
  }

  createVehicle(vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.apiUrl}/vehicles`, vehicle);
  }

  updateVehicle(id: number, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.apiUrl}/vehicles/${id}`, vehicle);
  }

  setPrimaryVehicle(id: number): Observable<Vehicle> {
    return this.http.put<Vehicle>(`${this.apiUrl}/vehicles/${id}/primary`, {});
  }

  deleteVehicle(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/vehicles/${id}`);
  }

  getCatalogMakes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/catalog/makes`).pipe(
      map(makes => (makes && makes.length > 0) ? makes : this.getFallbackMakes()),
      catchError(() => of(this.getFallbackMakes()))
    );
  }

  getCatalogModels(make: string): Observable<{ id: number; model: string; year_start: number | null; year_end: number | null }[]> {
    return this.http.get<{ id: number; model: string; year_start: number | null; year_end: number | null }[]>(
      `${this.apiUrl}/catalog/models?make=${encodeURIComponent(make)}`
    ).pipe(
      map(models => (models && models.length > 0) ? models : this.getFallbackModels(make)),
      catchError(() => of(this.getFallbackModels(make)))
    );
  }

  getCatalogYears(make: string, model: string): Observable<number[]> {
    return this.http.get<number[]>(
      `${this.apiUrl}/catalog/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
    ).pipe(
      map(years => (years && years.length > 0) ? years : this.getFallbackYears(make, model)),
      catchError(() => of(this.getFallbackYears(make, model)))
    );
  }

  getCatalogEngines(make: string, model: string, year?: number): Observable<EngineSpecItem[]> {
    let url = `${this.apiUrl}/catalog/engines?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    if (year) url += `&year=${encodeURIComponent(year)}`;
    return this.http.get<EngineSpecItem[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  private getFallbackMakes(): string[] {
    const set = new Set<string>();
    for (const item of CAR_CATALOG_DATA) {
      if (item.make) set.add(item.make);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  private getFallbackModels(make: string): { id: number; model: string; year_start: number | null; year_end: number | null }[] {
    const target = make.trim().toLowerCase();
    return CAR_CATALOG_DATA
      .filter(item => item.make.trim().toLowerCase() === target)
      .map(item => ({
        id: item.id,
        model: item.model,
        year_start: item.year_start,
        year_end: item.year_end
      }))
      .sort((a, b) => a.model.localeCompare(b.model));
  }

  private getFallbackYears(make: string, model: string): number[] {
    const targetMake = make.trim().toLowerCase();
    const targetModel = model.trim().toLowerCase();
    const currentYear = new Date().getFullYear();
    const found = CAR_CATALOG_DATA.find(
      item => item.make.trim().toLowerCase() === targetMake && item.model.trim().toLowerCase() === targetModel
    );
    const start = (found && found.year_start) ? found.year_start : 1995;
    const end = (found && found.year_end) ? found.year_end : currentYear;
    const years: number[] = [];
    for (let y = Math.min(end, currentYear); y >= start; y--) {
      years.push(y);
    }
    if (years.length === 0) {
      for (let y = currentYear; y >= 1995; y--) years.push(y);
    }
    return years;
  }


  getSymptoms(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(`${this.apiUrl}/symptoms`);
  }

  getRecentDiagnostics(): Observable<RecentDiagnostic[]> {
    return this.http.get<RecentDiagnostic[]>(`${this.apiUrl}/diagnostics/recent`);
  }

  startDiagnostic(symptomId: number | string, vehicleId = 1): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/diagnostic/start`, { symptom_id: symptomId, vehicle_id: vehicleId });
  }

  getCurrentQuestion(sessionId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/diagnostic/${sessionId}/question`);
  }

  submitAnswer(sessionId: number, questionId: number, optionId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/diagnostic/${sessionId}/answer`, {
      question_id: questionId,
      option_id: optionId
    });
  }

  getResults(sessionId: number): Observable<DiagnosticResultsResponse> {
    return this.http.get<DiagnosticResultsResponse>(`${this.apiUrl}/diagnostic/${sessionId}/results`);
  }

  submitFeedback(sessionId: number, feedback: { was_correct: boolean; confirmed_fault_id?: number; feedback_notes?: string; confidence_initial?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/diagnostic/${sessionId}/feedback`, feedback);
  }

  getRepairGuide(hypothesisId: number): Observable<RepairGuide> {
    return this.http.get<RepairGuide>(`${this.apiUrl}/diagnostic/guide/${hypothesisId}`);
  }

  lookupDtc(code: string, make?: string): Observable<DtcCode> {
    let url = `${this.apiUrl}/dtc/${encodeURIComponent(code)}`;
    if (make) url += `?make=${encodeURIComponent(make)}`;
    return this.http.get<DtcCode>(url);
  }

  searchDtc(query: string, type?: string, make?: string, limit = 50): Observable<DtcCode[]> {
    let url = `${this.apiUrl}/dtc/search?limit=${limit}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (type) url += `&type=${encodeURIComponent(type)}`;
    if (make) url += `&make=${encodeURIComponent(make)}`;
    return this.http.get<DtcCode[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  getPids(mode?: string): Observable<ObdPid[]> {
    let url = `${this.apiUrl}/pids`;
    if (mode) url += `?mode=${encodeURIComponent(mode)}`;
    return this.http.get<ObdPid[]>(url).pipe(
      map(rows => (rows && rows.length > 0) ? rows : (mode ? OBD_PIDS.filter(p => p.mode === mode) : OBD_PIDS)),
      catchError(() => of(mode ? OBD_PIDS.filter(p => p.mode === mode) : OBD_PIDS))
    );
  }

  getPid(mode: string, pid: string): Observable<ObdPid | null> {
    return this.http.get<ObdPid>(`${this.apiUrl}/pids/${encodeURIComponent(mode)}/${encodeURIComponent(pid)}`).pipe(
      catchError(() => {
        const found = OBD_PIDS.find(p => p.mode === mode && p.pid.toUpperCase() === pid.toUpperCase());
        return of(found || null);
      })
    );
  }

  getMaintenance(vehicleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/maintenance/${vehicleId}`);
  }

  // 12. Automotive Diagnostic Knowledge Base (Full Dataset)
  getKbCategories(): Observable<{ id: string; name: string; count: number; icon: string }[]> {
    return this.http.get<any[]>(`${this.apiUrl}/kb/categories`).pipe(
      map(rows => {
        if (rows && rows.length > 0) {
          return rows.map(r => ({
            id: r.category_id,
            name: r.category,
            count: r.count,
            icon: r.icon
          }));
        }
        return getDiagnosticCategories();
      }),
      catchError(() => of(getDiagnosticCategories()))
    );
  }

  getKbDiagnostics(category?: string, query?: string): Observable<DiagnosticItem[]> {
    let url = `${this.apiUrl}/kb/diagnostics`;
    const params: string[] = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (query) params.push(`query=${encodeURIComponent(query)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<DiagnosticItem[]>(url).pipe(
      map(items => (items && items.length > 0) ? items : this.fallbackLocalSearch(category, query)),
      catchError(() => of(this.fallbackLocalSearch(category, query)))
    );
  }

  getKbDiagnosticById(id: string): Observable<DiagnosticItem | null> {
    return this.http.get<DiagnosticItem>(`${this.apiUrl}/kb/diagnostics/${id}`).pipe(
      catchError(() => of(getDiagnosticById(id) || null))
    );
  }

  normalizeSymptom(text: string): Observable<AiNormalizeResult> {
    return this.http.post<AiNormalizeResult>(`${this.apiUrl}/normalize-symptom`, { text });
  }

  checkSafety(text: string): Observable<AiSafetyResult> {
    return this.http.post<AiSafetyResult>(`${this.apiUrl}/check-safety`, { text });
  }

  chatWithAssistant(payload: {
    message: string;
    vehicle?: Vehicle | null;
    history?: Array<{ role: string; content: string }>;
    api_key?: string | null;
    provider?: string | null;
    model?: string | null;
  }): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.apiUrl}/chat`, payload);
  }

  private fallbackLocalSearch(category?: string, query?: string): DiagnosticItem[] {
    let list = DIAGNOSTIC_DATABASE;
    if (category) {
      list = list.filter(item => item.category_id === category || item.category === category);
    }
    if (query) {
      const q = query.trim().toLowerCase();
      list = list.filter(item =>
        item.subcategory.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.symptoms.some(s => s.toLowerCase().includes(q))
      );
    }
    return list;
  }
}

export interface AiNormalizeResult {
  symptom_id: number | null;
  code: string | null;
  label: string | null;
  category: string | null;
  score: number;
  needs_clarification: boolean;
  message?: string;
  top_3_alternatives?: Array<{
    symptom_id: number;
    code: string;
    label: string;
    category: string;
    score: number;
  }>;
  fallback_applied?: boolean;
}

export interface AiSafetyResult {
  is_danger: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  critical_system: string | null;
  danger_reason: string | null;
  immediate_action: string;
  confidence: number;
  fallback_applied?: boolean;
}

export interface AiChatResponse {
  reply: string;
  provider: string;
  model: string;
  vehicle_applied: boolean;
  db_context_applied?: boolean;
  status: string;
  fallback_applied?: boolean;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
  db_context_applied?: boolean;
}

