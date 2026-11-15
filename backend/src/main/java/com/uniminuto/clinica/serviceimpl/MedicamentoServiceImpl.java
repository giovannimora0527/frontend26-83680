package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.LoteMedicamento;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.MovimientoInventario;
import com.uniminuto.clinica.entity.TipoMovimiento;
import com.uniminuto.clinica.entity.TipoProducto;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.AjusteInventarioRq;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.LoteRs;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MedicamentoRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.MovimientoRs;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.MovimientoInventarioRepository;
import com.uniminuto.clinica.service.MedicamentoService;
import com.uniminuto.clinica.util.Paginacion;
import com.uniminuto.clinica.util.UsuarioActual;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Implementación de las reglas del inventario. Las existencias viven en los
 * lotes y cada cambio deja un movimiento con su usuario responsable; una
 * operación nunca puede dejar un lote con cantidad negativa.
 */
@Service
public class MedicamentoServiceImpl implements MedicamentoService {

    /**
     * Días antes del vencimiento en los que un lote se considera próximo a vencer.
     */
    private static final int DIAS_ALERTA_VENCIMIENTO = 60;

    /**
     * Valor máximo de un precio.
     */
    private static final BigDecimal PRECIO_MAXIMO = new BigDecimal("9999999999.99");

    /**
     * Cantidad máxima por operación.
     */
    private static final int CANTIDAD_MAXIMA = 1_000_000;

    /**
     * Código interno: exactamente 8 caracteres alfanuméricos.
     */
    private static final Pattern CODIGO = Pattern.compile("^[A-Z0-9]{8}$");

    /**
     * Registro Invima: letras, números, guiones y barras.
     */
    private static final Pattern INVIMA = Pattern.compile("^[A-Za-z0-9/-]{5,30}$");

    /**
     * Número de lote: letras, números y guiones.
     */
    private static final Pattern NUMERO_LOTE = Pattern.compile("^[A-Za-z0-9-]{1,40}$");

    /**
     * Identificador que no existe, para reutilizar las consultas "IdNot" al crear.
     */
    private static final Long SIN_ID = -1L;

    /**
     * Orden de los movimientos: del más reciente al más antiguo.
     */
    private static final Map<String, String> ORDEN_MOVIMIENTOS = Map.of("fecha", "fecha");

    /**
     * Repositorio de productos.
     */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /**
     * Repositorio de lotes.
     */
    @Autowired
    private LoteMedicamentoRepository loteRepository;

    /**
     * Repositorio de movimientos.
     */
    @Autowired
    private MovimientoInventarioRepository movimientoRepository;

    /**
     * Usuario autenticado, responsable de los movimientos.
     */
    @Autowired
    private UsuarioActual usuarioActual;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<MedicamentoRs> listarMedicamentos(boolean soloActivos) {
        Map<Long, List<LoteMedicamento>> lotes = loteRepository.listarTodos().stream()
                .collect(Collectors.groupingBy(l -> l.getMedicamento().getId()));
        return medicamentoRepository.findAll(Sort.by("nombre")).stream()
                .filter(m -> !soloActivos || Boolean.TRUE.equals(m.getActivo()))
                .map(m -> this.convertirARespuesta(m, lotes.getOrDefault(m.getId(), List.of())))
                .toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public MedicamentoRs consultarMedicamento(Long id) {
        Medicamento medicamento = this.buscar(id);
        List<LoteMedicamento> lotes = loteRepository.findByMedicamento_Id(id);
        MedicamentoRs rs = this.convertirARespuesta(medicamento, lotes);
        rs.setLotes(lotes.stream()
                .sorted(Comparator.comparing(LoteMedicamento::getFechaVencimiento,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::convertirLote)
                .toList());
        return rs;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarMedicamento(MedicamentoRq rq) {
        Medicamento medicamento = new Medicamento();
        this.aplicarDatos(medicamento, rq, SIN_ID);
        medicamento.setActivo(true);
        medicamento.setFechaCreacionRegistro(LocalDateTime.now());
        medicamentoRepository.save(medicamento);
        return MiRespuestaRS.de(201, "Producto registrado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarMedicamento(Long id, MedicamentoRq rq) {
        Medicamento medicamento = this.buscar(id);
        if (!Boolean.TRUE.equals(medicamento.getActivo())) {
            throw new ConflictException("El producto está inactivo; actívelo antes de modificarlo");
        }
        this.aplicarDatos(medicamento, rq, id);
        medicamento.setFechaModificacionRegistro(LocalDateTime.now());
        medicamentoRepository.save(medicamento);
        return MiRespuestaRS.de(200, "Producto actualizado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Long id, boolean activar) {
        Medicamento medicamento = this.buscar(id);
        if (Boolean.valueOf(activar).equals(medicamento.getActivo())) {
            throw new ConflictException(activar ? "El producto ya está activo" : "El producto ya está inactivo");
        }
        medicamento.setActivo(activar);
        medicamento.setFechaModificacionRegistro(LocalDateTime.now());
        medicamentoRepository.save(medicamento);
        return MiRespuestaRS.de(200, activar ? "Producto activado correctamente" : "Producto inactivado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS registrarLote(Long id, LoteRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del lote");
        }
        Medicamento medicamento = this.buscar(id);
        if (!Boolean.TRUE.equals(medicamento.getActivo())) {
            throw new ConflictException("El producto está inactivo y no puede recibir lotes");
        }
        String numero = Validaciones.conPatron(rq.getNumeroLote(), "El número de lote", 40, NUMERO_LOTE,
                "El número de lote solo admite letras, números y guiones").toUpperCase();
        this.validarFechasLote(rq, medicamento.getTipo());
        this.validarCantidad(rq.getCantidad());
        this.validarPrecio(rq.getPrecioCompra(), "El precio de compra");
        if (loteRepository.existsByMedicamento_IdAndNumeroLoteIgnoreCase(id, numero)) {
            throw new ConflictException("El producto ya tiene un lote con el número " + numero);
        }

        LoteMedicamento lote = new LoteMedicamento();
        lote.setMedicamento(medicamento);
        lote.setNumeroLote(numero);
        lote.setFechaCompra(rq.getFechaCompra());
        lote.setFechaIngreso(rq.getFechaIngreso());
        lote.setFechaVencimiento(rq.getFechaVencimiento());
        lote.setCantidadInicial(rq.getCantidad());
        lote.setCantidadDisponible(rq.getCantidad());
        lote.setPrecioCompra(rq.getPrecioCompra());
        lote.setFechaCreacion(LocalDateTime.now());
        loteRepository.save(lote);

        this.registrarMovimiento(lote, TipoMovimiento.ENTRADA, rq.getCantidad(),
                "Ingreso del lote " + numero, null);
        return MiRespuestaRS.de(201, "Lote registrado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS ajustarLote(Long loteId, AjusteInventarioRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del ajuste");
        }
        boolean esEntrada = "ENTRADA".equalsIgnoreCase(rq.getSentido());
        if (!esEntrada && !"SALIDA".equalsIgnoreCase(rq.getSentido())) {
            throw new BadRequestException("El sentido del ajuste debe ser ENTRADA o SALIDA");
        }
        this.validarCantidad(rq.getCantidad());
        String motivo = Validaciones.obligatorio(rq.getMotivo(), "El motivo del ajuste", 255);

        LoteMedicamento lote = loteRepository.buscarParaActualizar(loteId)
                .orElseThrow(() -> new NotFoundException("El lote no existe"));
        if (!esEntrada && rq.getCantidad() > lote.getCantidadDisponible()) {
            throw new ConflictException("El ajuste dejaría el lote con cantidad negativa; solo hay "
                    + lote.getCantidadDisponible() + " unidades disponibles");
        }

        lote.setCantidadDisponible(lote.getCantidadDisponible() + (esEntrada ? rq.getCantidad() : -rq.getCantidad()));
        loteRepository.save(lote);
        this.registrarMovimiento(lote, esEntrada ? TipoMovimiento.AJUSTE_ENTRADA : TipoMovimiento.AJUSTE_SALIDA,
                rq.getCantidad(), "Ajuste manual del lote " + lote.getNumeroLote(), motivo);
        return MiRespuestaRS.de(200, "Ajuste registrado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<MovimientoRs> listarMovimientos(Long id, int page, int size) {
        this.buscar(id);
        return PaginaRs.desde(movimientoRepository
                .findByMedicamento_Id(id, Paginacion.crear(page, size, "fecha", "desc",
                        ORDEN_MOVIMIENTOS, "fecha", "movimientoId"))
                .map(this::convertirMovimiento));
    }

    /**
     * Valida los datos del producto (incluida la unicidad, antes de modificar
     * la entidad) y los copia.
     *
     * @param medicamento producto a completar.
     * @param rq          datos recibidos.
     * @param id          producto que se edita (SIN_ID al crear).
     */
    private void aplicarDatos(Medicamento medicamento, MedicamentoRq rq, Long id) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del producto");
        }
        String codigo = Validaciones.conPatron(
                rq.getCodigo() == null ? null : rq.getCodigo().trim().toUpperCase(), "El código", 8, CODIGO,
                "El código debe tener exactamente 8 letras o números");
        String nombre = Validaciones.obligatorio(rq.getNombre(), "El nombre", 100);
        TipoProducto tipo = Paginacion.convertirEnum(TipoProducto.class, rq.getTipo());
        if (tipo == null) {
            throw new BadRequestException("Debe indicar el tipo de producto");
        }
        String invima = Validaciones.opcional(rq.getRegistroInvima(), "El registro Invima", 30);
        if (invima == null && tipo == TipoProducto.MEDICAMENTO) {
            throw new BadRequestException("El registro Invima es obligatorio para los medicamentos");
        }
        if (invima != null && !INVIMA.matcher(invima).matches()) {
            throw new BadRequestException("El registro Invima debe tener de 5 a 30 letras, números, guiones o barras");
        }
        this.validarPrecio(rq.getPrecioVenta(), "El precio de venta");
        if (rq.getStockMinimo() == null || rq.getStockMinimo() < 0 || rq.getStockMinimo() > CANTIDAD_MAXIMA) {
            throw new BadRequestException("El stock mínimo debe ser un entero entre 0 y " + CANTIDAD_MAXIMA);
        }
        boolean cambioPedido = !Objects.equals(rq.getFechaProximoPedido(), medicamento.getFechaProximoPedido());
        if (cambioPedido && rq.getFechaProximoPedido() != null
                && rq.getFechaProximoPedido().isBefore(LocalDate.now())) {
            throw new BadRequestException("La fecha del próximo pedido no puede estar en el pasado");
        }
        if (medicamentoRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, id)) {
            throw new ConflictException("Ya existe un producto con el código " + codigo);
        }
        if (medicamentoRepository.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ConflictException("Ya existe un producto llamado " + nombre);
        }

        medicamento.setCodigo(codigo);
        medicamento.setNombre(nombre);
        medicamento.setDescripcion(Validaciones.opcional(rq.getDescripcion(), "La descripción", 255));
        medicamento.setPresentacion(Validaciones.opcional(rq.getPresentacion(), "La presentación", 100));
        medicamento.setTipo(tipo);
        medicamento.setRegistroInvima(invima);
        medicamento.setPrecioVenta(rq.getPrecioVenta());
        BigDecimal iva = rq.getIvaPorcentaje() == null ? BigDecimal.ZERO : rq.getIvaPorcentaje();
        if (iva.signum() < 0 || iva.compareTo(BigDecimal.valueOf(100)) > 0 || iva.scale() > 2) {
            throw new BadRequestException("El IVA debe estar entre 0 y 100 % con máximo dos decimales");
        }
        medicamento.setIvaPorcentaje(iva);
        medicamento.setStockMinimo(rq.getStockMinimo());
        medicamento.setFechaProximoPedido(rq.getFechaProximoPedido());
    }

    /**
     * Valida las fechas de un lote nuevo.
     *
     * @param rq   datos del lote.
     * @param tipo tipo de producto.
     */
    private void validarFechasLote(LoteRq rq, TipoProducto tipo) {
        LocalDate hoy = LocalDate.now();
        if (rq.getFechaCompra() == null) {
            throw new BadRequestException("Debe indicar la fecha de compra");
        }
        if (rq.getFechaCompra().isAfter(hoy)) {
            throw new BadRequestException("La fecha de compra no puede ser futura");
        }
        if (rq.getFechaIngreso() == null) {
            throw new BadRequestException("Debe indicar la fecha de ingreso al inventario");
        }
        if (rq.getFechaIngreso().isAfter(hoy)) {
            throw new BadRequestException("La fecha de ingreso no puede ser futura");
        }
        if (rq.getFechaIngreso().isBefore(rq.getFechaCompra())) {
            throw new BadRequestException("La fecha de ingreso no puede ser anterior a la fecha de compra");
        }
        if (rq.getFechaVencimiento() == null) {
            if (tipo == TipoProducto.MEDICAMENTO) {
                throw new BadRequestException("La fecha de vencimiento es obligatoria para los medicamentos");
            }
        } else if (!rq.getFechaVencimiento().isAfter(hoy)) {
            throw new BadRequestException("No se puede ingresar un lote vencido o que vence hoy");
        }
    }

    /**
     * Valida una cantidad de unidades.
     *
     * @param cantidad cantidad recibida.
     */
    private void validarCantidad(Integer cantidad) {
        if (cantidad == null || cantidad < 1 || cantidad > CANTIDAD_MAXIMA) {
            throw new BadRequestException("La cantidad debe ser un entero entre 1 y " + CANTIDAD_MAXIMA);
        }
    }

    /**
     * Valida un precio.
     *
     * @param precio precio recibido.
     * @param nombre nombre del campo.
     */
    private void validarPrecio(BigDecimal precio, String nombre) {
        if (precio == null || precio.signum() <= 0 || precio.compareTo(PRECIO_MAXIMO) > 0) {
            throw new BadRequestException(nombre + " debe ser mayor que 0 y no superar " + PRECIO_MAXIMO);
        }
        if (precio.scale() > 2) {
            throw new BadRequestException(nombre + " admite máximo dos decimales");
        }
    }

    /**
     * Registra un movimiento con el saldo actual del lote.
     *
     * @param lote        lote afectado, ya actualizado.
     * @param tipo        tipo de movimiento.
     * @param cantidad    unidades movidas.
     * @param referencia  referencia del origen.
     * @param observacion observación o motivo.
     */
    private void registrarMovimiento(LoteMedicamento lote, TipoMovimiento tipo, int cantidad,
                                     String referencia, String observacion) {
        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setMedicamento(lote.getMedicamento());
        movimiento.setLote(lote);
        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setSaldoLote(lote.getCantidadDisponible());
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setUsuario(usuarioActual.obtener());
        movimiento.setReferencia(referencia);
        movimiento.setObservacion(observacion);
        movimientoRepository.save(movimiento);
    }

    /**
     * Busca un producto por su identificador.
     *
     * @param id identificador.
     * @return el producto.
     */
    private Medicamento buscar(Long id) {
        return medicamentoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("El producto no existe"));
    }

    /**
     * Indica si un lote ya venció (el día del vencimiento todavía es vigente).
     *
     * @param lote lote.
     * @return true si está vencido.
     */
    private boolean estaVencido(LoteMedicamento lote) {
        return lote.getFechaVencimiento() != null && lote.getFechaVencimiento().isBefore(LocalDate.now());
    }

    /**
     * Indica si un lote vigente vence dentro del periodo de alerta.
     *
     * @param lote lote.
     * @return true si está próximo a vencer.
     */
    private boolean proximoAVencer(LoteMedicamento lote) {
        return lote.getFechaVencimiento() != null && !this.estaVencido(lote)
                && !lote.getFechaVencimiento().isAfter(LocalDate.now().plusDays(DIAS_ALERTA_VENCIMIENTO));
    }

    /**
     * Calcula existencias y alertas del producto a partir de sus lotes.
     *
     * @param medicamento producto.
     * @param lotes       lotes del producto.
     * @return respuesta sin el detalle de lotes.
     */
    private MedicamentoRs convertirARespuesta(Medicamento medicamento, List<LoteMedicamento> lotes) {
        List<LoteMedicamento> conExistencia = lotes.stream().filter(l -> l.getCantidadDisponible() > 0).toList();
        List<LoteMedicamento> vigentes = conExistencia.stream().filter(l -> !this.estaVencido(l)).toList();
        int disponible = vigentes.stream().mapToInt(LoteMedicamento::getCantidadDisponible).sum();
        int vencida = conExistencia.stream().filter(this::estaVencido)
                .mapToInt(LoteMedicamento::getCantidadDisponible).sum();

        MedicamentoRs rs = new MedicamentoRs();
        rs.setId(medicamento.getId());
        rs.setCodigo(medicamento.getCodigo());
        rs.setNombre(medicamento.getNombre());
        rs.setDescripcion(medicamento.getDescripcion());
        rs.setPresentacion(medicamento.getPresentacion());
        rs.setTipo(medicamento.getTipo().name());
        rs.setRegistroInvima(medicamento.getRegistroInvima());
        rs.setPrecioVenta(medicamento.getPrecioVenta());
        rs.setIvaPorcentaje(medicamento.getIvaPorcentaje());
        rs.setStockMinimo(medicamento.getStockMinimo());
        rs.setFechaProximoPedido(medicamento.getFechaProximoPedido());
        rs.setActivo(medicamento.getActivo());
        rs.setFechaCreacion(medicamento.getFechaCreacionRegistro());
        rs.setFechaModificacion(medicamento.getFechaModificacionRegistro());
        rs.setCantidadDisponible(disponible);
        rs.setCantidadVencida(vencida);
        rs.setEstadoStock(disponible == 0 ? "AGOTADO"
                : disponible <= medicamento.getStockMinimo() ? "STOCK_BAJO" : "NORMAL");
        rs.setProximoAVencer(vigentes.stream().anyMatch(this::proximoAVencer));
        rs.setTieneVencidos(vencida > 0);
        rs.setProximoVencimiento(vigentes.stream().map(LoteMedicamento::getFechaVencimiento)
                .filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null));
        rs.setUltimoPrecioCompra(lotes.stream()
                .filter(l -> l.getPrecioCompra().signum() > 0)
                .max(Comparator.comparing(LoteMedicamento::getFechaIngreso)
                        .thenComparing(LoteMedicamento::getLoteId))
                .map(LoteMedicamento::getPrecioCompra).orElse(null));
        return rs;
    }

    /**
     * Convierte un lote en su respuesta con el estado calculado.
     *
     * @param lote lote.
     * @return respuesta.
     */
    private LoteRs convertirLote(LoteMedicamento lote) {
        LoteRs rs = new LoteRs();
        rs.setLoteId(lote.getLoteId());
        rs.setNumeroLote(lote.getNumeroLote());
        rs.setFechaCompra(lote.getFechaCompra());
        rs.setFechaIngreso(lote.getFechaIngreso());
        rs.setFechaVencimiento(lote.getFechaVencimiento());
        rs.setCantidadInicial(lote.getCantidadInicial());
        rs.setCantidadDisponible(lote.getCantidadDisponible());
        rs.setPrecioCompra(lote.getPrecioCompra());
        rs.setEstado(this.estaVencido(lote) ? "VENCIDO"
                : lote.getCantidadDisponible() == 0 ? "AGOTADO"
                : this.proximoAVencer(lote) ? "PROXIMO_A_VENCER" : "VIGENTE");
        return rs;
    }

    /**
     * Convierte un movimiento en su respuesta.
     *
     * @param movimiento movimiento.
     * @return respuesta.
     */
    private MovimientoRs convertirMovimiento(MovimientoInventario movimiento) {
        MovimientoRs rs = new MovimientoRs();
        rs.setMovimientoId(movimiento.getMovimientoId());
        rs.setFecha(movimiento.getFecha());
        rs.setTipo(movimiento.getTipo().name());
        rs.setNumeroLote(movimiento.getLote().getNumeroLote());
        rs.setCantidad(movimiento.getCantidad());
        rs.setSaldoLote(movimiento.getSaldoLote());
        rs.setUsuario(movimiento.getUsuario().getUsername());
        rs.setReferencia(movimiento.getReferencia());
        rs.setObservacion(movimiento.getObservacion());
        rs.setFormulaId(movimiento.getFormula() == null ? null : movimiento.getFormula().getFormulaId());
        rs.setDespachoId(movimiento.getDespacho() == null ? null : movimiento.getDespacho().getDespachoId());
        return rs;
    }
}
