package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.AlertasInventarioRs;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.ImpuestoRepository;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.MovimientoInventarioRepository;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.service.MedicamentoService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import java.util.stream.Collectors;

@Service
public class MedicamentoServiceImpl implements MedicamentoService {

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private LoteMedicamentoRepository loteRepository;

    @Autowired
    private MovimientoInventarioRepository movimientoRepository;

    @Autowired
    private ImpuestoRepository impuestoRepository;

    @Autowired
    private InventarioMotor inventarioMotor;

    @Autowired
    private AuthService authService;

    @Override
    @Transactional(readOnly = true)
    public List<MedicamentoRs> listar(String filtro, String texto) {
        LocalDate hoy = LocalDate.now();
        Map<Long, List<LoteMedicamento>> lotesPorMed = loteRepository.todosConExistencia().stream()
                .collect(Collectors.groupingBy(l -> l.getMedicamento().getId()));
        String f = filtro == null ? "TODOS" : filtro.trim().toUpperCase();
        String q = Validar.vacio(texto) ? null : texto.trim().toLowerCase();
        List<MedicamentoRs> salida = new ArrayList<>();
        for (Medicamento m : medicamentoRepository.findAllByOrderByNombreAsc()) {
            if (q != null && !m.getNombre().toLowerCase().contains(q) && !m.getCodigo().toLowerCase().contains(q)) {
                continue;
            }
            MedicamentoRs r = construir(m, lotesPorMed.getOrDefault(m.getId(), List.of()), hoy);
            boolean incluir = switch (f) {
                case "DISPONIBLES" -> r.getActivo() && r.getStockVigente() > 0;
                case "AGOTADOS" -> r.getActivo() && "AGOTADO".equals(r.getEstadoStock());
                case "BAJO_STOCK" -> r.getActivo() && "BAJO_STOCK".equals(r.getEstadoStock());
                case "PROXIMOS_VENCER" -> r.isProximoAVencer();
                case "VENCIDOS" -> r.isConLotesVencidos();
                case "INACTIVOS" -> !r.getActivo();
                case "TODOS" -> true;
                default -> throw new BadRequestException("Filtro de inventario no válido: " + filtro);
            };
            if (incluir) {
                salida.add(r);
            }
        }
        return salida;
    }

    @Override
    @Transactional(readOnly = true)
    public MedicamentoRs consultar(Long id) {
        Medicamento m = medicamento(id);
        return construir(m, loteRepository.conExistenciaFefo(id), LocalDate.now());
    }

    /** Calcula stock vigente/vencido, estado y vencimientos a partir de los lotes con existencia. */
    static MedicamentoRs construir(Medicamento m, List<LoteMedicamento> lotes, LocalDate hoy) {
        MedicamentoRs r = MedicamentoRs.de(m);
        int vigente = 0;
        int vencido = 0;
        LocalDate proximo = null;
        for (LoteMedicamento l : lotes) {
            if (l.estaVencido(hoy)) {
                vencido += l.getCantidadDisponible();
            } else {
                vigente += l.getCantidadDisponible();
                if (l.getFechaVencimiento() != null && (proximo == null || l.getFechaVencimiento().isBefore(proximo))) {
                    proximo = l.getFechaVencimiento();
                }
            }
        }
        r.setStockVigente(vigente);
        r.setStockVencido(vencido);
        r.setConLotesVencidos(vencido > 0);
        r.setEstadoStock(vigente == 0 ? "AGOTADO" : (vigente <= m.getStockMinimo() ? "BAJO_STOCK" : "NORMAL"));
        r.setVencimientoProximo(proximo);
        if (proximo != null) {
            long dias = ChronoUnit.DAYS.between(hoy, proximo);
            r.setDiasParaVencer(dias);
            r.setProximoAVencer(dias <= Constantes.DIAS_PROXIMO_VENCER);
        }
        return r;
    }

    @Override
    @Transactional
    public MiRespuestaRS crear(MedicamentoRq rq) {
        validar(rq, true);
        String codigo = rq.getCodigo().trim().toUpperCase();
        if (medicamentoRepository.findByCodigoIgnoreCase(codigo).isPresent()) {
            throw new ConflictException("Ya existe un producto con el código " + codigo + ".");
        }
        if (medicamentoRepository.findByNombreIgnoreCase(rq.getNombre().trim()).isPresent()) {
            throw new ConflictException("Ya existe un producto con el nombre '" + rq.getNombre().trim() + "'.");
        }
        Medicamento m = new Medicamento();
        m.setCodigo(codigo);
        mapear(m, rq);
        m.setStockActual(0);
        m.setActivo(Boolean.TRUE);
        m.setFechaCreacionRegistro(LocalDateTime.now());
        medicamentoRepository.save(m);
        if (rq.getLoteInicial() != null && !Validar.vacio(rq.getLoteInicial().getNumeroLote())) {
            ingresar(m, rq.getLoteInicial(), Constantes.CONCEPTO_COMPRA, "Lote inicial al registrar el producto");
        }
        return MiRespuestaRS.creado("Producto registrado correctamente.", m.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizar(MedicamentoRq rq) {
        validar(rq, false);
        Medicamento m = medicamento(rq.getId());
        if (!m.getCodigo().equalsIgnoreCase(rq.getCodigo().trim())) {
            throw new ConflictException("El código del producto no se puede modificar (identifica sus movimientos).");
        }
        if (medicamentoRepository.existsByNombreIgnoreCaseAndIdNot(rq.getNombre().trim(), m.getId())) {
            throw new ConflictException("Ya existe otro producto con el nombre '" + rq.getNombre().trim() + "'.");
        }
        mapear(m, rq);
        m.setFechaModificacionRegistro(LocalDateTime.now());
        medicamentoRepository.save(m);
        return MiRespuestaRS.ok("Producto actualizado correctamente.", m.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Long id, boolean activo) {
        Medicamento m = medicamento(id);
        m.setActivo(activo);
        m.setFechaModificacionRegistro(LocalDateTime.now());
        medicamentoRepository.save(m);
        return MiRespuestaRS.ok(activo ? "Producto activado." : "Producto inactivado (no se podrá formular).", id);
    }

    @Override
    @Transactional
    public MiRespuestaRS registrarLote(LoteRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del lote es obligatoria.");
        }
        Medicamento m = medicamento(rq.getMedicamentoId());
        LoteMedicamento lote = ingresar(m, rq, Constantes.CONCEPTO_COMPRA,
                Validar.vacio(rq.getObservacion()) ? "Ingreso por compra" : rq.getObservacion().trim());
        return MiRespuestaRS.creado("Lote " + lote.getNumeroLote() + " ingresado: +" + lote.getCantidadInicial()
                + " " + m.getUnidadMedida().toLowerCase() + "(s).", lote.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoteMedicamento> lotes(Long medicamentoId, boolean soloConExistencia) {
        medicamento(medicamentoId);
        return soloConExistencia ? loteRepository.conExistenciaFefo(medicamentoId)
                : loteRepository.findByMedicamento_IdOrderByFechaVencimientoAscIdAsc(medicamentoId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoInventario> movimientos(Long medicamentoId, String tipo, LocalDate desde, LocalDate hasta) {
        LocalDate d = desde == null ? LocalDate.now().minusYears(5) : desde;
        LocalDate h = hasta == null ? LocalDate.now() : hasta;
        if (d.isAfter(h)) {
            throw new BadRequestException("La fecha inicial no puede ser mayor a la final.");
        }
        String t = Validar.vacio(tipo) ? "" : Validar.enLista(tipo, List.of(Constantes.MOV_ENTRADA, Constantes.MOV_SALIDA), "tipo");
        return movimientoRepository.buscar(medicamentoId == null ? -1L : medicamentoId, t,
                d.atStartOfDay(), h.plusDays(1).atStartOfDay());
    }

    @Override
    @Transactional(readOnly = true)
    public AlertasInventarioRs alertas() {
        List<MedicamentoRs> todos = listar("TODOS", null).stream().filter(MedicamentoRs::getActivo).toList();
        LocalDate hoy = LocalDate.now();
        return new AlertasInventarioRs(todos.size(),
                todos.stream().filter(r -> "AGOTADO".equals(r.getEstadoStock())).count(),
                todos.stream().filter(r -> "BAJO_STOCK".equals(r.getEstadoStock())).count(),
                todos.stream().filter(MedicamentoRs::isProximoAVencer).count(),
                todos.stream().filter(MedicamentoRs::isConLotesVencidos).count(),
                todos.stream().filter(r -> r.getFechaProximoPedido() != null && !r.getFechaProximoPedido().isAfter(hoy)).count());
    }

    private LoteMedicamento ingresar(Medicamento m, LoteRq rq, String concepto, String observacion) {
        if (!Boolean.TRUE.equals(m.getActivo())) {
            throw new ConflictException("El producto está inactivo; actívelo antes de ingresar existencias.");
        }
        String numero = Validar.texto(rq.getNumeroLote(), "número de lote", 50);
        Validar.obligatorio(rq.getFechaCompra(), "fecha de compra");
        LocalDate hoy = LocalDate.now();
        if (rq.getFechaCompra().isAfter(hoy)) {
            throw new BadRequestException("La fecha de compra no puede ser futura.");
        }
        boolean esMedicamento = Constantes.PRODUCTO_MEDICAMENTO.equals(m.getTipoProducto());
        if (esMedicamento && rq.getFechaVencimiento() == null) {
            throw new BadRequestException("La fecha de vencimiento es obligatoria para medicamentos.");
        }
        if (rq.getFechaVencimiento() != null) {
            if (!rq.getFechaVencimiento().isAfter(rq.getFechaCompra())) {
                throw new BadRequestException("La fecha de vencimiento debe ser posterior a la fecha de compra.");
            }
            if (!rq.getFechaVencimiento().isAfter(hoy)) {
                throw new BadRequestException("No se puede ingresar un lote vencido.");
            }
        }
        Validar.entero(rq.getCantidad(), "cantidad", 1, 1_000_000);
        LoteMedicamento lote = new LoteMedicamento();
        lote.setNumeroLote(numero.toUpperCase());
        lote.setFechaCompra(rq.getFechaCompra());
        lote.setFechaIngreso(hoy);
        lote.setFechaVencimiento(rq.getFechaVencimiento());
        lote.setPrecioCompra(Validar.dinero(rq.getPrecioCompra() == null ? m.getPrecioCompra() : rq.getPrecioCompra(),
                "precio de compra del lote", true));
        lote.setCantidadInicial(rq.getCantidad());
        return inventarioMotor.ingresarLote(m, lote, authService.usuarioActual(),
                new InventarioMotor.Referencia(concepto, null, null, null, null, observacion));
    }

    private Medicamento medicamento(Long id) {
        Validar.idValido(id, "medicamentoId");
        return medicamentoRepository.findById(id).orElseThrow(() -> new NotFoundException("El producto no existe."));
    }

    private void mapear(Medicamento m, MedicamentoRq rq) {
        String tipo = rq.getTipoProducto().trim().toUpperCase();
        boolean requiere = Constantes.PRODUCTO_MEDICAMENTO.equals(tipo) || Boolean.TRUE.equals(rq.getRequiereInvima());
        m.setNombre(rq.getNombre().trim());
        m.setDescripcion(Validar.limpiar(rq.getDescripcion()));
        m.setPresentacion(Validar.limpiar(rq.getPresentacion()));
        m.setTipoProducto(tipo);
        m.setRequiereInvima(requiere);
        m.setRegistroInvima(Validar.limpiar(rq.getRegistroInvima()));
        m.setUnidadMedida(rq.getUnidadMedida().trim().toUpperCase());
        m.setPrecioCompra(Validar.dinero(rq.getPrecioCompra(), "precio de compra", true));
        m.setPrecioVenta(Validar.dinero(rq.getPrecioVenta(), "precio de venta", true));
        m.setStockMinimo(rq.getStockMinimo());
        m.setFechaProximoPedido(rq.getFechaProximoPedido());
        Impuesto imp = impuestoRepository.findById(rq.getImpuestoId())
                .orElseThrow(() -> new NotFoundException("El impuesto no existe."));
        m.setImpuesto(imp);
    }

    private void validar(MedicamentoRq rq, boolean nuevo) {
        if (rq == null) {
            throw new BadRequestException("La información del producto es obligatoria.");
        }
        if (!nuevo) {
            Validar.idValido(rq.getId(), "id");
        }
        String codigo = Validar.texto(rq.getCodigo(), "código", 8);
        if (!codigo.matches(Constantes.REGEX_CODIGO_MEDICAMENTO)) {
            throw new BadRequestException("El código debe tener exactamente 8 caracteres alfanuméricos.");
        }
        Validar.texto(rq.getNombre(), "nombre", 100);
        Validar.textoOpcional(rq.getPresentacion(), "presentación", 100);
        String tipo = Validar.enLista(rq.getTipoProducto(), Constantes.TIPOS_PRODUCTO, "tipo de producto");
        boolean requiere = Constantes.PRODUCTO_MEDICAMENTO.equals(tipo) || Boolean.TRUE.equals(rq.getRequiereInvima());
        String invima = Validar.textoOpcional(rq.getRegistroInvima(), "registro INVIMA", 50);
        if (requiere && invima == null) {
            throw new BadRequestException("El registro INVIMA es obligatorio para medicamentos y productos que lo requieren.");
        }
        Validar.texto(rq.getUnidadMedida(), "unidad de medida", 30);
        Validar.dinero(rq.getPrecioCompra(), "precio de compra", true);
        Validar.dinero(rq.getPrecioVenta(), "precio de venta", true);
        if (rq.getPrecioVenta().compareTo(rq.getPrecioCompra()) < 0) {
            throw new BadRequestException("El precio de venta no puede ser menor al precio de compra.");
        }
        Validar.entero(rq.getStockMinimo(), "stock mínimo", 0, 1_000_000);
        Validar.idValido(rq.getImpuestoId(), "impuestoId");
        if (rq.getFechaProximoPedido() != null && nuevo && rq.getFechaProximoPedido().isBefore(LocalDate.now())) {
            throw new BadRequestException("La fecha del próximo pedido no puede estar en el pasado.");
        }
    }

    /** Lotes vigentes ordenados FEFO (usado por otros módulos). */
    static List<LoteMedicamento> vigentesFefo(List<LoteMedicamento> lotes, LocalDate hoy) {
        return lotes.stream().filter(l -> !l.estaVencido(hoy))
                .sorted(Comparator.comparing(LoteMedicamento::getFechaVencimiento,
                        Comparator.nullsLast(Comparator.naturalOrder())).thenComparing(LoteMedicamento::getId))
                .collect(Collectors.toList());
    }

}
