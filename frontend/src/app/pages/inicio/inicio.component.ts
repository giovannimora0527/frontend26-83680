import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { hoyISO, sumarDias } from '../../core/util';

/** Tablero de inicio según el perfil. */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
  <h4 class="titulo-pagina mb-1">Bienvenido(a), {{ auth.usuario()?.nombreCompleto }}</h4>
  <p class="text-muted">Perfil {{ auth.usuario()?.perfilNombre }}. Seleccione un módulo del menú.</p>

  @if (alertas) {
    <h6 class="mt-4 mb-2">Inventario</h6>
    <div class="row g-3">
      @for (k of kpisInventario; track k.t) {
        <div class="col-6 col-lg-2"><div class="card kpi h-100" [style.border-left-color]="k.c"><div class="card-body py-2">
          <div class="text-muted small">{{ k.t }}</div><div class="valor">{{ k.v }}</div></div></div></div>
      }
    </div>
  }
  @if (citas) {
    <h6 class="mt-4 mb-2">Citas de la semana {{ auth.tienePerfil('MEDICO') ? '(mi agenda)' : '' }}</h6>
    <div class="row g-3">
      @for (e of estados; track e.k) {
        <div class="col-6 col-lg-2"><div class="card kpi h-100" [style.border-left-color]="e.c"><div class="card-body py-2">
          <div class="text-muted small">{{ e.t }}</div><div class="valor">{{ (citas[e.k] || 0) | number }}</div></div></div></div>
      }
    </div>
  }
  <div class="row g-3 mt-2">
    @for (m of auth.menus(); track m.menuId) {
      <div class="col-6 col-md-4 col-xl-3">
        <a class="card h-100 text-decoration-none text-reset" [routerLink]="m.url">
          <div class="card-body d-flex align-items-center gap-3">
            <i [class]="m.icon.startsWith('feather') ? 'bi bi-people' : m.icon" class="fs-3 text-primary"></i>
            <span class="fw-semibold">{{ m.title }}</span>
          </div>
        </a>
      </div>
    }
  </div>
  `
})
export class InicioComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  alertas: any = null;
  citas: Record<string, number> | null = null;
  kpisInventario: { t: string; v: number; c: string }[] = [];
  estados = [
    { k: 'TOTAL', t: 'Total', c: '#0d47a1' }, { k: 'PENDIENTE', t: 'Pendientes', c: '#f0ad4e' },
    { k: 'CONFIRMADA', t: 'Confirmadas', c: '#0d6efd' }, { k: 'EN_ATENCION', t: 'En atención', c: '#6f42c1' },
    { k: 'ATENDIDA', t: 'Atendidas', c: '#198754' }, { k: 'CANCELADA', t: 'Canceladas', c: '#dc3545' }
  ];

  ngOnInit(): void {
    if (this.auth.tienePerfil('ADMIN', 'DESPACHO_MEDICO', 'MEDICO')) {
      this.api.get<any>('/medicamento/alertas').subscribe(a => {
        this.alertas = a;
        this.kpisInventario = [
          { t: 'Productos activos', v: a.totalProductos, c: '#0d47a1' }, { t: 'Agotados', v: a.agotados, c: '#dc3545' },
          { t: 'Bajo stock', v: a.bajoStock, c: '#f0ad4e' }, { t: 'Próximos a vencer', v: a.proximosAVencer, c: '#fd7e14' },
          { t: 'Con lotes vencidos', v: a.conLotesVencidos, c: '#6c757d' }, { t: 'Pedidos pendientes', v: a.pedidosPendientes, c: '#20c997' }
        ];
      });
    }
    if (this.auth.tienePerfil('ADMIN', 'RECEPCION', 'MEDICO')) {
      const ini = hoyISO();
      this.api.get<Record<string, number>>('/cita/resumen-estados', { fechaInicial: ini, fechaFinal: sumarDias(ini, 7) })
        .subscribe(r => {
          r['PENDIENTE'] = (r['PENDIENTE'] ?? 0) + (r['PROGRAMADA'] ?? 0);
          this.citas = r;
        });
    }
  }
}
