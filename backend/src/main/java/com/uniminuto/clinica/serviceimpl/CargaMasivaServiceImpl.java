package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.CargaMasiva;
import com.uniminuto.clinica.entity.CargaMasivaDetalle;
import com.uniminuto.clinica.entity.Impuesto;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.CargaMasivaRs;
import com.uniminuto.clinica.repository.CargaMasivaDetalleRepository;
import com.uniminuto.clinica.repository.CargaMasivaRepository;
import com.uniminuto.clinica.repository.ImpuestoRepository;
import com.uniminuto.clinica.repository.LoteMedicamentoRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.security.ContextoUsuario;
import com.uniminuto.clinica.service.AuthService;
import com.uniminuto.clinica.service.CargaMasivaService;
import com.uniminuto.clinica.utils.Constantes;
import com.uniminuto.clinica.utils.ExcelUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class CargaMasivaServiceImpl implements CargaMasivaService {

    private static final Logger LOG = LoggerFactory.getLogger(CargaMasivaServiceImpl.class);

    @Autowired
    private CargaMasivaRepository cargaRepository;

    @Autowired
    private CargaMasivaDetalleRepository detalleRepository;

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private LoteMedicamentoRepository loteRepository;

    @Autowired
    private ImpuestoRepository impuestoRepository;

    @Autowired
    private CargaMasivaImportador importador;

    @Autowired
    private AuthService authService;

    @Override
    public byte[] plantilla() {
        XSSFWorkbook wb = new XSSFWorkbook();
        ExcelUtil.Estilos e = new ExcelUtil.Estilos(wb);
        Sheet hoja = wb.createSheet("Inventario");
        Row h = hoja.createRow(0);
        for (int i = 0; i < CargaMasivaFormato.COLUMNAS.size(); i++) {
            h.createCell(i).setCellValue(CargaMasivaFormato.COLUMNAS.get(i));
            h.getCell(i).setCellStyle(e.encabezado);
            hoja.setColumnWidth(i, 20 * 256);
        }
        String hoy = LocalDate.now().toString();
        String vence = LocalDate.now().plusYears(2).toString();
        String[][] ejemplos = {
                {"CEFA0500", "Cefalexina 500 mg", "Antibiótico", "Caja x 10 cápsulas", "MEDICAMENTO",
                        "INVIMA 2024M-0001234", "CAPSULA", "1200", "2500", "IVA5", "20", "CFX-0001", "100", hoy, vence, ""},
                {"GUAN0001", "Guantes de nitrilo talla M", "Caja x 100", "Caja", "INSUMO", "", "CAJA", "18000",
                        "30000", "IVA19", "5", "GNT-0001", "10", hoy, "", ""}};
        for (int r = 0; r < ejemplos.length; r++) {
            Row row = hoja.createRow(r + 1);
            for (int c = 0; c < ejemplos[r].length; c++) {
                row.createCell(c).setCellValue(ejemplos[r][c]);
            }
        }
        Sheet ins = wb.createSheet("Instrucciones");
        String[][] texto = {
                {"Columna", "Obligatoria", "Regla"},
                {"codigo", "Sí", "8 caracteres alfanuméricos. Identifica el producto (único)."},
                {"nombre", "Sí", "Máximo 100 caracteres. Único en el inventario."},
                {"tipo_producto", "Sí", "MEDICAMENTO, INSUMO o UTENSILIO."},
                {"registro_invima", "Sólo MEDICAMENTO", "Obligatorio para medicamentos."},
                {"precio_compra / precio_venta", "Sí", "Números >= 0. La venta no puede ser menor a la compra."},
                {"impuesto", "Sí", "Código de impuesto configurado (ej. IVA19, IVA5, EXCLUIDO)."},
                {"numero_lote / cantidad", "Sí", "Lote no repetido para el producto; cantidad entera > 0."},
                {"fecha_compra", "Sí", "yyyy-MM-dd o dd/MM/yyyy; no futura."},
                {"fecha_vencimiento", "Sólo MEDICAMENTO", "Posterior a la compra y a hoy."},
                {"Productos existentes", "", "Si el código ya existe con el mismo nombre, la fila ingresa un lote nuevo."}};
        for (int r = 0; r < texto.length; r++) {
            Row row = ins.createRow(r);
            for (int c = 0; c < 3; c++) {
                row.createCell(c).setCellValue(texto[r][c]);
                if (r == 0) {
                    row.getCell(c).setCellStyle(e.encabezado);
                }
            }
        }
        ins.setColumnWidth(0, 28 * 256);
        ins.setColumnWidth(1, 18 * 256);
        ins.setColumnWidth(2, 80 * 256);
        return ExcelUtil.bytes(wb);
    }

    @Override
    @Transactional
    public CargaMasivaRs previsualizar(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new BadRequestException("Debe adjuntar un archivo .xlsx o .csv.");
        }
        byte[] contenido;
        try {
            contenido = archivo.getBytes();
        } catch (java.io.IOException e) {
            throw new BadRequestException("No fue posible leer el archivo adjunto.");
        }
        String nombreArchivo = archivo.getOriginalFilename() == null ? "archivo" : archivo.getOriginalFilename();
        CargaMasivaLector.Lectura lectura = CargaMasivaLector.leer(nombreArchivo, contenido);

        List<String> faltantes = CargaMasivaFormato.COLUMNAS.stream()
                .filter(c -> !lectura.encabezados().contains(c)).toList();
        if (!faltantes.isEmpty()) {
            throw new BadRequestException("Estructura de archivo inválida. Faltan las columnas: "
                    + String.join(", ", faltantes) + ". Descargue la plantilla.");
        }
        if (lectura.filas().isEmpty()) {
            throw new BadRequestException("El archivo no contiene registros.");
        }

        CargaMasiva carga = new CargaMasiva();
        carga.setNombreArchivo(nombreArchivo.length() > 255 ? nombreArchivo.substring(0, 255) : nombreArchivo);
        carga.setTipoArchivo(nombreArchivo.toLowerCase().endsWith(".csv") ? "CSV" : "XLSX");
        carga.setEstado(Constantes.CARGA_PREVISUALIZADA);
        carga.setTotalRegistros(lectura.filas().size());
        carga.setRegistrosValidos(0);
        carga.setRegistrosError(0);
        carga.setRegistrosImportados(0);
        carga.setUsuario(authService.usuarioActual());
        carga.setFechaCarga(LocalDateTime.now());
        cargaRepository.save(carga);

        Contexto ctx = new Contexto();
        int validos = 0;
        List<CargaMasivaDetalle> detalles = new ArrayList<>();
        for (CargaMasivaLector.FilaLeida fila : lectura.filas()) {
            Map<String, String> v = new LinkedHashMap<>();
            for (String c : CargaMasivaFormato.COLUMNAS) {
                v.put(c, fila.valores().getOrDefault(c, ""));
            }
            List<String> errores = new ArrayList<>();
            String accion = validarFila(v, ctx, errores);
            v.put(CargaMasivaFormato.CLAVE_ACCION, accion);
            CargaMasivaDetalle d = new CargaMasivaDetalle();
            d.setCargaId(carga.getId());
            d.setFila(fila.numero());
            d.setCodigo(recortar(v.get("codigo"), 50));
            d.setNombre(recortar(v.get("nombre"), 255));
            d.setDatos(CargaMasivaFormato.serializar(v));
            d.setValido(errores.isEmpty());
            d.setErrores(errores.isEmpty() ? null : String.join(CargaMasivaFormato.SEPARADOR_ERRORES, errores));
            d.setEstado(errores.isEmpty() ? Constantes.FILA_VALIDA : Constantes.FILA_ERROR);
            if (errores.isEmpty()) {
                validos++;
            }
            detalles.add(d);
        }
        detalleRepository.saveAll(detalles);
        carga.setRegistrosValidos(validos);
        carga.setRegistrosError(lectura.filas().size() - validos);
        cargaRepository.save(carga);
        return construir(carga, detalles);
    }

    @Override
    public CargaMasivaRs confirmar(Long cargaId) {
        Integer usuarioId = ContextoUsuario.obtener().usuarioId();
        importador.iniciar(cargaId, usuarioId);
        for (CargaMasivaDetalle d : detalleRepository.findByCargaIdOrderByFilaAsc(cargaId)) {
            if (!Constantes.FILA_VALIDA.equals(d.getEstado())) {
                continue;
            }
            try {
                importador.importarFila(cargaId, d.getId(), usuarioId);
            } catch (RuntimeException ex) {
                LOG.warn("Fila {} de la carga {} no importada: {}", d.getFila(), cargaId, ex.getMessage());
                importador.marcarFallida(d.getId(), ex.getMessage() == null ? ex.getClass().getSimpleName() : ex.getMessage());
            }
        }
        importador.finalizar(cargaId);
        return detalle(cargaId);
    }

    @Override
    @Transactional
    public CargaMasivaRs cancelar(Long cargaId) {
        CargaMasiva carga = cargaRepository.bloquear(cargaId)
                .orElseThrow(() -> new NotFoundException("La carga masiva no existe."));
        if (!Constantes.CARGA_PREVISUALIZADA.equals(carga.getEstado())) {
            throw new ConflictException("Sólo se puede cancelar una carga en vista previa.");
        }
        carga.setEstado(Constantes.CARGA_CANCELADA);
        carga.setUsuarioConfirma(authService.usuarioActual());
        carga.setFechaConfirmacion(LocalDateTime.now());
        cargaRepository.save(carga);
        return detalle(cargaId);
    }

    @Override
    @Transactional(readOnly = true)
    public CargaMasivaRs detalle(Long cargaId) {
        CargaMasiva carga = cargaRepository.findById(cargaId)
                .orElseThrow(() -> new NotFoundException("La carga masiva no existe."));
        return construir(carga, detalleRepository.findByCargaIdOrderByFilaAsc(cargaId));
    }

    @Override
    public List<CargaMasiva> historial() {
        return cargaRepository.findAllByOrderByFechaCargaDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] reporteErrores(Long cargaId) {
        CargaMasiva carga = cargaRepository.findById(cargaId)
                .orElseThrow(() -> new NotFoundException("La carga masiva no existe."));
        XSSFWorkbook wb = new XSSFWorkbook();
        ExcelUtil.Estilos e = new ExcelUtil.Estilos(wb);
        Sheet hoja = wb.createSheet("Errores");
        Row t = hoja.createRow(0);
        t.createCell(0).setCellValue("Informe de errores - carga #" + carga.getId() + " - " + carga.getNombreArchivo());
        t.getCell(0).setCellStyle(e.titulo);
        hoja.createRow(1).createCell(0).setCellValue("Usuario: " + carga.getUsuario().getNombreCompleto()
                + " | Fecha: " + carga.getFechaCarga() + " | Total: " + carga.getTotalRegistros()
                + " | Válidos: " + carga.getRegistrosValidos() + " | Con error: " + carga.getRegistrosError());
        String[] cab = {"Fila", "Código", "Nombre", "Estado", "Motivo del rechazo"};
        Row h = hoja.createRow(3);
        for (int i = 0; i < cab.length; i++) {
            h.createCell(i).setCellValue(cab[i]);
            h.getCell(i).setCellStyle(e.encabezado);
        }
        int r = 4;
        for (CargaMasivaDetalle d : detalleRepository.findByCargaIdOrderByFilaAsc(cargaId)) {
            if (Constantes.FILA_VALIDA.equals(d.getEstado()) || Constantes.FILA_IMPORTADA.equals(d.getEstado())) {
                continue;
            }
            Row row = hoja.createRow(r++);
            row.createCell(0).setCellValue(d.getFila());
            row.createCell(1).setCellValue(d.getCodigo() == null ? "" : d.getCodigo());
            row.createCell(2).setCellValue(d.getNombre() == null ? "" : d.getNombre());
            row.createCell(3).setCellValue(d.getEstado());
            row.createCell(4).setCellValue(d.getErrores() == null ? "" : d.getErrores());
        }
        int[] anchos = {8, 12, 35, 12, 110};
        for (int i = 0; i < anchos.length; i++) {
            hoja.setColumnWidth(i, anchos[i] * 256);
        }
        return ExcelUtil.bytes(wb);
    }

    // ------------------------------------------------------------------ validación

    /** Estado acumulado para detectar duplicados dentro del mismo archivo. */
    private static class Contexto {
        final Map<String, String> nombrePorCodigo = new HashMap<>();
        final Map<String, String> codigoPorNombre = new HashMap<>();
        final Set<String> lotes = new HashSet<>();
        final Map<String, Optional<Impuesto>> impuestos = new HashMap<>();
    }

    private String validarFila(Map<String, String> v, Contexto ctx, List<String> errores) {
        LocalDate hoy = LocalDate.now();
        String codigo = v.get("codigo").trim().toUpperCase();
        String nombre = v.get("nombre").trim();
        String tipo = v.get("tipo_producto").trim().toUpperCase();

        if (codigo.isEmpty()) {
            errores.add("El código es obligatorio");
        } else if (!codigo.matches(Constantes.REGEX_CODIGO_MEDICAMENTO)) {
            errores.add("El código debe tener 8 caracteres alfanuméricos");
        }
        if (nombre.isEmpty()) {
            errores.add("El nombre es obligatorio");
        } else if (nombre.length() > 100) {
            errores.add("El nombre supera 100 caracteres");
        }
        if (!Constantes.TIPOS_PRODUCTO.contains(tipo)) {
            errores.add("tipo_producto debe ser MEDICAMENTO, INSUMO o UTENSILIO");
        }
        boolean esMedicamento = Constantes.PRODUCTO_MEDICAMENTO.equals(tipo);
        if (esMedicamento && v.get("registro_invima").isBlank()) {
            errores.add("El registro INVIMA es obligatorio para medicamentos");
        }
        if (v.get("registro_invima").length() > 50) {
            errores.add("El registro INVIMA supera 50 caracteres");
        }
        BigDecimal compra = CargaMasivaFormato.decimal(v.get("precio_compra"));
        BigDecimal venta = CargaMasivaFormato.decimal(v.get("precio_venta"));
        if (compra == null || compra.signum() < 0) {
            errores.add("precio_compra inválido (número >= 0)");
        }
        if (venta == null || venta.signum() < 0) {
            errores.add("precio_venta inválido (número >= 0)");
        }
        if (compra != null && venta != null && venta.compareTo(compra) < 0) {
            errores.add("El precio de venta es menor al precio de compra");
        }
        String codImp = v.get("impuesto").trim().toUpperCase();
        if (codImp.isEmpty()) {
            errores.add("El impuesto es obligatorio");
        } else {
            Optional<Impuesto> imp = ctx.impuestos.computeIfAbsent(codImp, impuestoRepository::findByCodigoIgnoreCase);
            if (imp.isEmpty() || !Boolean.TRUE.equals(imp.get().getActivo())) {
                errores.add("Impuesto '" + codImp + "' inexistente o inactivo");
            }
        }
        if (!v.get("stock_minimo").isBlank()) {
            Integer min = CargaMasivaFormato.entero(v.get("stock_minimo"));
            if (min == null || min < 0) {
                errores.add("stock_minimo debe ser un entero >= 0");
            }
        }
        String lote = v.get("numero_lote").trim().toUpperCase();
        if (lote.isEmpty()) {
            errores.add("El número de lote es obligatorio");
        } else if (lote.length() > 50) {
            errores.add("El número de lote supera 50 caracteres");
        }
        Integer cantidad = CargaMasivaFormato.entero(v.get("cantidad"));
        if (cantidad == null || cantidad <= 0) {
            errores.add("La cantidad debe ser un entero mayor a 0");
        }
        LocalDate fCompra = CargaMasivaFormato.fecha(v.get("fecha_compra"));
        if (fCompra == null) {
            errores.add("fecha_compra obligatoria y con formato válido");
        } else if (fCompra.isAfter(hoy)) {
            errores.add("La fecha de compra no puede ser futura");
        }
        String txtVence = v.get("fecha_vencimiento");
        LocalDate fVence = CargaMasivaFormato.fecha(txtVence);
        if (!txtVence.isBlank() && fVence == null) {
            errores.add("fecha_vencimiento con formato inválido");
        } else if (fVence == null && esMedicamento) {
            errores.add("La fecha de vencimiento es obligatoria para medicamentos");
        } else if (fVence != null) {
            if (fCompra != null && !fVence.isAfter(fCompra)) {
                errores.add("La fecha de vencimiento debe ser posterior a la de compra");
            }
            if (!fVence.isAfter(hoy)) {
                errores.add("El lote está vencido");
            }
        }
        if (!v.get("fecha_proximo_pedido").isBlank() && CargaMasivaFormato.fecha(v.get("fecha_proximo_pedido")) == null) {
            errores.add("fecha_proximo_pedido con formato inválido");
        }

        // Reglas de identificación / duplicados
        String accion = "Nuevo producto + lote";
        if (!codigo.isEmpty() && !nombre.isEmpty()) {
            String nombreEnArchivo = ctx.nombrePorCodigo.get(codigo);
            if (nombreEnArchivo != null && !nombreEnArchivo.equalsIgnoreCase(nombre)) {
                errores.add("Código duplicado en el archivo con otro nombre ('" + nombreEnArchivo + "')");
            }
            String codigoEnArchivo = ctx.codigoPorNombre.get(nombre.toLowerCase());
            if (codigoEnArchivo != null && !codigoEnArchivo.equals(codigo)) {
                errores.add("Nombre duplicado en el archivo con otro código (" + codigoEnArchivo + ")");
            }
            if (!lote.isEmpty() && !ctx.lotes.add(codigo + "|" + lote)) {
                errores.add("Registro duplicado en el archivo (mismo código y lote)");
            }
            ctx.nombrePorCodigo.putIfAbsent(codigo, nombre);
            ctx.codigoPorNombre.putIfAbsent(nombre.toLowerCase(), codigo);

            Optional<Medicamento> porCodigo = medicamentoRepository.findByCodigoIgnoreCase(codigo);
            if (porCodigo.isPresent()) {
                Medicamento m = porCodigo.get();
                if (!m.getNombre().equalsIgnoreCase(nombre)) {
                    errores.add("El código ya existe en el inventario con el nombre '" + m.getNombre() + "'");
                } else if (!lote.isEmpty() && loteRepository.existsByMedicamento_IdAndNumeroLoteIgnoreCase(m.getId(), lote)) {
                    errores.add("Medicamento duplicado: el lote " + lote + " ya está registrado");
                } else if (!Boolean.TRUE.equals(m.getActivo())) {
                    errores.add("El producto existe pero está inactivo");
                } else {
                    accion = "Nuevo lote de producto existente";
                }
            } else {
                Optional<Medicamento> porNombre = medicamentoRepository.findByNombreIgnoreCase(nombre);
                porNombre.ifPresent(m -> errores.add("Medicamento duplicado: el nombre ya existe con el código " + m.getCodigo()));
            }
        }
        return errores.isEmpty() ? accion : "Rechazado";
    }

    private CargaMasivaRs construir(CargaMasiva carga, List<CargaMasivaDetalle> detalles) {
        List<CargaMasivaRs.Fila> filas = new ArrayList<>();
        for (CargaMasivaDetalle d : detalles) {
            Map<String, String> datos = CargaMasivaFormato.deserializar(d.getDatos());
            String accion = datos.remove(CargaMasivaFormato.CLAVE_ACCION);
            List<String> errores = d.getErrores() == null ? List.of()
                    : Arrays.asList(d.getErrores().split(" \\| "));
            filas.add(new CargaMasivaRs.Fila(d.getId(), d.getFila(), d.getCodigo(), d.getNombre(), datos,
                    Boolean.TRUE.equals(d.getValido()), d.getEstado(), errores, accion));
        }
        return new CargaMasivaRs(carga, CargaMasivaFormato.COLUMNAS, filas);
    }

    private static String recortar(String s, int max) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
