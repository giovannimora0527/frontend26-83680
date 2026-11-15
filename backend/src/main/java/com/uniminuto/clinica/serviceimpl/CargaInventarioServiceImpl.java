package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.CargaInventario;
import com.uniminuto.clinica.entity.CargaInventarioDetalle;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.CargaRs;
import com.uniminuto.clinica.models.LoteRq;
import com.uniminuto.clinica.models.MedicamentoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.CargaInventarioDetalleRepository;
import com.uniminuto.clinica.repository.CargaInventarioRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.service.CargaInventarioService;
import com.uniminuto.clinica.service.MedicamentoService;
import com.uniminuto.clinica.util.UsuarioActual;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Carga masiva de inventario. Flujo:
 * <ol>
 *     <li><b>Validar</b>: se lee el archivo (.xlsx o .csv), se verifican los encabezados y cada fila
 *         (obligatorios, formatos, precios, cantidades, fechas, duplicados en el archivo y en la base).
 *         La carga y el resultado de cada fila quedan guardados (log de cargue) con usuario y fecha,
 *         y se devuelve la vista previa.</li>
 *     <li><b>Confirmar</b>: se importan solo las filas válidas. Cada fila se crea en su propia
 *         transacción con las mismas reglas del formulario de inventario (producto y, si trae, su lote
 *         con la entrada de inventario); si una fila falla, se revierte solo esa fila y las demás se
 *         conservan.</li>
 * </ol>
 */
@Service
public class CargaInventarioServiceImpl implements CargaInventarioService {

    /** Máximo de filas por archivo. */
    private static final int MAXIMO_FILAS = 5000;

    /** Encabezados obligatorios, en el orden de la plantilla. */
    private static final List<String> ENCABEZADOS = List.of("codigo", "nombre", "tipo", "presentacion", "descripcion",
            "registro_invima", "precio_venta", "iva", "stock_minimo", "numero_lote", "fecha_compra", "fecha_vencimiento",
            "cantidad", "precio_compra");

    /** Código de 8 caracteres alfanuméricos. */
    private static final Pattern CODIGO = Pattern.compile("^[A-Z0-9]{8}$");

    /** Registro Invima. */
    private static final Pattern INVIMA = Pattern.compile("^[A-Za-z0-9/-]{5,30}$");

    /** Número de lote. */
    private static final Pattern LOTE = Pattern.compile("^[A-Za-z0-9-]{1,40}$");

    /** Formatos de fecha aceptados. */
    private static final List<DateTimeFormatter> FORMATOS_FECHA = List.of(
            DateTimeFormatter.ISO_LOCAL_DATE, DateTimeFormatter.ofPattern("d/M/yyyy"), DateTimeFormatter.ofPattern("d-M-yyyy"));

    /** Cargas. */
    @Autowired
    private CargaInventarioRepository cargaRepository;

    /** Filas de las cargas. */
    @Autowired
    private CargaInventarioDetalleRepository detalleRepository;

    /** Productos. */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /** Reglas del inventario (las mismas del formulario). */
    @Autowired
    private MedicamentoService medicamentoService;

    /** Usuario autenticado. */
    @Autowired
    private UsuarioActual usuarioActual;

    /** Transacción independiente por fila. */
    private final TransactionTemplate porFila;

    /**
     * @param transactionManager administrador de transacciones.
     */
    public CargaInventarioServiceImpl(PlatformTransactionManager transactionManager) {
        this.porFila = new TransactionTemplate(transactionManager);
        this.porFila.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ===================== Plantilla =====================

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] plantilla() {
        try (XSSFWorkbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Sheet hoja = libro.createSheet("Inventario");
            CellStyle cab = this.estiloCabecera(libro);
            Row r0 = hoja.createRow(0);
            for (int i = 0; i < ENCABEZADOS.size(); i++) {
                Cell c = r0.createCell(i);
                c.setCellValue(ENCABEZADOS.get(i));
                c.setCellStyle(cab);
            }
            String hoy = LocalDate.now().minusDays(5).toString();
            String vence = LocalDate.now().plusYears(1).toString();
            String[][] ejemplos = {
                {"AMX00500", "Amoxicilina 500 mg", "MEDICAMENTO", "Tabletas x 10", "Antibiótico de amplio espectro",
                    "INVIMA-2024M-0001", "1500", "0", "20", "L-2026-001", hoy, vence, "100", "800"},
                {"GUA00100", "Guantes de nitrilo talla M", "INSUMO", "Caja x 100", "", "", "35000", "19", "5", "", "", "", "", ""}
            };
            for (int f = 0; f < ejemplos.length; f++) {
                Row r = hoja.createRow(f + 1);
                for (int i = 0; i < ejemplos[f].length; i++) {
                    r.createCell(i).setCellValue(ejemplos[f][i]);
                }
            }
            for (int i = 0; i < ENCABEZADOS.size(); i++) {
                hoja.autoSizeColumn(i);
            }
            Sheet ayuda = libro.createSheet("Instrucciones");
            String[] lineas = {
                "Instrucciones de la carga masiva de inventario",
                "codigo: 8 letras o números, único (por ejemplo AMX00500).",
                "nombre: obligatorio y único. tipo: MEDICAMENTO o INSUMO.",
                "registro_invima: obligatorio para MEDICAMENTO (5 a 30 caracteres).",
                "precio_venta: mayor que 0. iva: 0 a 100 (vacío = 0). stock_minimo: entero mayor o igual a 0.",
                "Lote (opcional en insumos): numero_lote, fecha_compra (no futura), cantidad (entero mayor que 0),",
                "precio_compra (mayor que 0) y fecha_vencimiento (obligatoria en medicamentos y posterior a hoy).",
                "Fechas en formato AAAA-MM-DD o DD/MM/AAAA. Se aceptan archivos .xlsx o .csv (separado por , o ;).",
                "Primero se valida el archivo y se muestra la vista previa; solo se importan las filas válidas al confirmar."
            };
            for (int i = 0; i < lineas.length; i++) {
                ayuda.createRow(i).createCell(0).setCellValue(lineas[i]);
            }
            libro.write(salida);
            return salida.toByteArray();
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo generar la plantilla");
        }
    }

    // ===================== Validación =====================

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public CargaRs validar(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new BadRequestException("Seleccione un archivo .xlsx o .csv");
        }
        String nombre = archivo.getOriginalFilename() == null ? "archivo" : archivo.getOriginalFilename();
        String extension = nombre.contains(".") ? nombre.substring(nombre.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        List<List<String>> tabla;
        try (InputStream in = archivo.getInputStream()) {
            tabla = switch (extension) {
                case "xlsx" -> this.leerExcel(in);
                case "csv" -> this.leerCsv(in.readAllBytes());
                default -> throw new BadRequestException("Formato no admitido: use un archivo .xlsx o .csv");
            };
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo leer el archivo; verifique que no esté dañado");
        } catch (org.apache.poi.EmptyFileException | org.apache.poi.openxml4j.exceptions.NotOfficeXmlFileException ex) {
            throw new BadRequestException("El archivo no es un Excel (.xlsx) válido");
        }
        if (tabla.isEmpty()) {
            throw new BadRequestException("El archivo está vacío");
        }

        // Estructura: encabezados obligatorios.
        List<String> encabezados = tabla.get(0).stream().map(CargaInventarioServiceImpl::normalizarEncabezado).toList();
        List<String> faltantes = ENCABEZADOS.stream().filter(h -> !encabezados.contains(h)).toList();
        if (!faltantes.isEmpty()) {
            throw new BadRequestException("Faltan columnas en el encabezado: " + String.join(", ", faltantes)
                    + ". Descargue la plantilla para ver el formato");
        }
        Map<String, Integer> indice = new HashMap<>();
        for (int i = 0; i < encabezados.size(); i++) {
            indice.putIfAbsent(encabezados.get(i), i);
        }

        CargaInventario carga = new CargaInventario();
        carga.setArchivo(nombre.length() > 200 ? nombre.substring(0, 200) : nombre);
        carga.setFormato(extension.toUpperCase(Locale.ROOT));
        carga.setUsuario(usuarioActual.obtener());
        carga.setFecha(LocalDateTime.now());
        carga.setEstado("VALIDADA");

        Map<String, Integer> codigos = new HashMap<>();
        Map<String, Integer> nombres = new HashMap<>();
        int validas = 0;
        for (int f = 1; f < tabla.size(); f++) {
            List<String> fila = tabla.get(f);
            if (fila.stream().allMatch(v -> v == null || v.isBlank())) {
                continue;
            }
            if (carga.getDetalles().size() >= MAXIMO_FILAS) {
                throw new BadRequestException("El archivo supera el máximo de " + MAXIMO_FILAS + " filas");
            }
            CargaInventarioDetalle d = this.leerFila(fila, indice, f + 1);
            d.setCarga(carga);
            List<String> errores = this.validarFila(d);
            String codigo = d.getCodigo() == null ? "" : d.getCodigo().toUpperCase(Locale.ROOT);
            String nombreProducto = d.getNombre() == null ? "" : d.getNombre().trim().toLowerCase(Locale.ROOT);
            if (!codigo.isBlank()) {
                Integer previa = codigos.putIfAbsent(codigo, d.getFila());
                if (previa != null) {
                    errores.add("código repetido en el archivo (ya está en la fila " + previa + ")");
                } else if (medicamentoRepository.existsByCodigoIgnoreCaseAndIdNot(codigo, -1L)) {
                    errores.add("ya existe un producto con el código " + codigo);
                }
            }
            if (!nombreProducto.isBlank()) {
                Integer previa = nombres.putIfAbsent(nombreProducto, d.getFila());
                if (previa != null) {
                    errores.add("nombre repetido en el archivo (ya está en la fila " + previa + ")");
                } else if (medicamentoRepository.existsByNombreIgnoreCaseAndIdNot(d.getNombre().trim(), -1L)) {
                    errores.add("ya existe un producto con el nombre " + d.getNombre().trim());
                }
            }
            if (errores.isEmpty()) {
                d.setEstado("VALIDA");
                d.setMensaje("Lista para importar");
                validas++;
            } else {
                d.setEstado("ERROR");
                String mensaje = String.join("; ", errores);
                d.setMensaje(mensaje.length() > 1000 ? mensaje.substring(0, 997) + "..." : mensaje);
            }
            carga.getDetalles().add(d);
        }
        if (carga.getDetalles().isEmpty()) {
            throw new BadRequestException("El archivo no tiene filas de datos debajo del encabezado");
        }
        carga.setTotalFilas(carga.getDetalles().size());
        carga.setFilasValidas(validas);
        carga.setFilasError(carga.getDetalles().size() - validas);
        carga.setFilasImportadas(0);
        cargaRepository.save(carga);
        return this.convertir(carga, carga.getDetalles());
    }

    // ===================== Confirmación =====================

    /**
     * {@inheritDoc}
     */
    @Override
    public CargaRs confirmar(Long cargaId) {
        // Se marca la carga como confirmada antes de importar, para que no se procese dos veces.
        CargaInventario carga = porFila.execute(tx -> {
            CargaInventario c = this.buscar(cargaId);
            if (!"VALIDADA".equals(c.getEstado())) {
                throw new ConflictException("La carga N.° " + cargaId + " ya fue " + c.getEstado().toLowerCase(Locale.ROOT));
            }
            if (c.getFilasValidas() == 0) {
                throw new ConflictException("La carga no tiene filas válidas para importar");
            }
            c.setEstado("CONFIRMADA");
            c.setFechaConfirmacion(LocalDateTime.now());
            return cargaRepository.save(c);
        });

        int importadas = 0;
        for (CargaInventarioDetalle d : detalleRepository.findByCarga_CargaIdOrderByFilaAsc(cargaId)) {
            if (!"VALIDA".equals(d.getEstado())) {
                continue;
            }
            try {
                Long id = porFila.execute(tx -> this.importarFila(d));
                d.setEstado("IMPORTADA");
                d.setMedicamentoId(id);
                d.setMensaje(d.getNumeroLote() == null || d.getNumeroLote().isBlank()
                        ? "Producto creado" : "Producto y lote " + d.getNumeroLote() + " creados");
                importadas++;
            } catch (RuntimeException ex) {
                d.setEstado("FALLIDA");
                d.setMensaje("No se importó: " + (ex.getMessage() == null ? "error inesperado" : ex.getMessage()));
            }
            detalleRepository.save(d);
        }
        int total = importadas;
        porFila.executeWithoutResult(tx -> {
            CargaInventario c = this.buscar(cargaId);
            c.setFilasImportadas(total);
            cargaRepository.save(c);
        });
        return this.consultar(carga.getCargaId());
    }

    /**
     * Crea el producto de una fila y, si la trae, su lote (con la entrada de inventario).
     *
     * @param d fila validada.
     * @return identificador del producto creado.
     */
    private Long importarFila(CargaInventarioDetalle d) {
        MedicamentoRq rq = new MedicamentoRq();
        rq.setCodigo(d.getCodigo().trim().toUpperCase(Locale.ROOT));
        rq.setNombre(d.getNombre().trim());
        rq.setTipo(d.getTipo().trim().toUpperCase(Locale.ROOT));
        rq.setPresentacion(vacioANull(d.getPresentacion()));
        rq.setDescripcion(vacioANull(d.getDescripcion()));
        rq.setRegistroInvima(vacioANull(d.getRegistroInvima()));
        rq.setPrecioVenta(decimal(d.getPrecioVenta()));
        rq.setIvaPorcentaje(vacio(d.getIva()) ? BigDecimal.ZERO : decimal(d.getIva()));
        rq.setStockMinimo(entero(d.getStockMinimo()));
        medicamentoService.guardarMedicamento(rq);
        Long id = medicamentoRepository.findFirstByCodigoIgnoreCase(rq.getCodigo())
                .orElseThrow(() -> new ConflictException("No se encontró el producto recién creado")).getId();
        if (!vacio(d.getNumeroLote())) {
            LoteRq lote = new LoteRq();
            lote.setNumeroLote(d.getNumeroLote().trim());
            lote.setFechaCompra(fecha(d.getFechaCompra()));
            lote.setFechaIngreso(LocalDate.now());
            lote.setFechaVencimiento(vacio(d.getFechaVencimiento()) ? null : fecha(d.getFechaVencimiento()));
            lote.setCantidad(entero(d.getCantidad()));
            lote.setPrecioCompra(decimal(d.getPrecioCompra()));
            medicamentoService.registrarLote(id, lote);
        }
        return id;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS descartar(Long cargaId) {
        CargaInventario c = this.buscar(cargaId);
        if (!"VALIDADA".equals(c.getEstado())) {
            throw new ConflictException("Solo se descarta una carga que no se ha confirmado");
        }
        c.setEstado("DESCARTADA");
        cargaRepository.save(c);
        return MiRespuestaRS.de(200, "Carga descartada; no se importó ningún registro");
    }

    // ===================== Consultas =====================

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<CargaRs> listar(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BadRequestException("Página o tamaño inválido");
        }
        return PaginaRs.desde(cargaRepository.findAllByOrderByFechaDescCargaIdDesc(PageRequest.of(page, size))
                .map(c -> this.convertir(c, null)));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public CargaRs consultar(Long cargaId) {
        return this.convertir(this.buscar(cargaId), detalleRepository.findByCarga_CargaIdOrderByFilaAsc(cargaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public byte[] informeErrores(Long cargaId) {
        CargaInventario carga = this.buscar(cargaId);
        List<CargaInventarioDetalle> filas = detalleRepository.findByCarga_CargaIdOrderByFilaAsc(cargaId).stream()
                .filter(d -> "ERROR".equals(d.getEstado()) || "FALLIDA".equals(d.getEstado())).toList();
        try (XSSFWorkbook libro = new XSSFWorkbook(); ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            Sheet hoja = libro.createSheet("Errores");
            hoja.createRow(0).createCell(0).setCellValue("Informe de errores de la carga N.° " + carga.getCargaId()
                    + " (" + carga.getArchivo() + ") — " + filas.size() + " filas rechazadas de " + carga.getTotalFilas());
            CellStyle cab = this.estiloCabecera(libro);
            String[] titulos = {"Fila", "Código", "Nombre", "Estado", "Motivo del rechazo"};
            Row r = hoja.createRow(2);
            for (int i = 0; i < titulos.length; i++) {
                Cell c = r.createCell(i);
                c.setCellValue(titulos[i]);
                c.setCellStyle(cab);
            }
            int n = 3;
            for (CargaInventarioDetalle d : filas) {
                Row x = hoja.createRow(n++);
                x.createCell(0).setCellValue(d.getFila());
                x.createCell(1).setCellValue(texto(d.getCodigo()));
                x.createCell(2).setCellValue(texto(d.getNombre()));
                x.createCell(3).setCellValue("ERROR".equals(d.getEstado()) ? "Rechazada en la validación" : "Falló al importar");
                x.createCell(4).setCellValue(texto(d.getMensaje()));
            }
            for (int i = 0; i < 4; i++) {
                hoja.autoSizeColumn(i);
            }
            hoja.setColumnWidth(4, 100 * 256);
            libro.write(salida);
            return salida.toByteArray();
        } catch (IOException ex) {
            throw new BadRequestException("No se pudo generar el informe de errores");
        }
    }

    // ===================== Lectura de archivos =====================

    /**
     * Lee la primera hoja de un Excel como texto (las fechas en formato AAAA-MM-DD).
     */
    private List<List<String>> leerExcel(InputStream in) throws IOException {
        List<List<String>> tabla = new ArrayList<>();
        DataFormatter formato = new DataFormatter(Locale.ROOT);
        try (XSSFWorkbook libro = new XSSFWorkbook(in)) {
            Sheet hoja = libro.getSheetAt(0);
            int columnas = hoja.getRow(hoja.getFirstRowNum()) == null ? 0 : hoja.getRow(hoja.getFirstRowNum()).getLastCellNum();
            for (int i = hoja.getFirstRowNum(); i <= hoja.getLastRowNum(); i++) {
                Row fila = hoja.getRow(i);
                List<String> valores = new ArrayList<>();
                for (int c = 0; c < columnas; c++) {
                    Cell celda = fila == null ? null : fila.getCell(c);
                    if (celda == null) {
                        valores.add("");
                    } else if (celda.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(celda)) {
                        valores.add(celda.getLocalDateTimeCellValue().toLocalDate().toString());
                    } else if (celda.getCellType() == CellType.NUMERIC) {
                        valores.add(BigDecimal.valueOf(celda.getNumericCellValue()).stripTrailingZeros().toPlainString());
                    } else {
                        valores.add(formato.formatCellValue(celda).trim());
                    }
                }
                tabla.add(valores);
            }
        }
        return tabla;
    }

    /**
     * Lee un CSV en UTF-8 separado por coma o punto y coma, con comillas dobles opcionales.
     */
    private List<List<String>> leerCsv(byte[] bytes) {
        String contenido = new String(bytes, StandardCharsets.UTF_8);
        if (contenido.startsWith("﻿")) {
            contenido = contenido.substring(1);
        }
        String primera = contenido.lines().findFirst().orElse("");
        char separador = primera.chars().filter(ch -> ch == ';').count() > primera.chars().filter(ch -> ch == ',').count()
                ? ';' : ',';
        List<List<String>> tabla = new ArrayList<>();
        List<String> fila = new ArrayList<>();
        StringBuilder valor = new StringBuilder();
        boolean comillas = false;
        for (int i = 0; i < contenido.length(); i++) {
            char ch = contenido.charAt(i);
            if (comillas) {
                if (ch == '"' && i + 1 < contenido.length() && contenido.charAt(i + 1) == '"') {
                    valor.append('"');
                    i++;
                } else if (ch == '"') {
                    comillas = false;
                } else {
                    valor.append(ch);
                }
            } else if (ch == '"') {
                comillas = true;
            } else if (ch == separador) {
                fila.add(valor.toString().trim());
                valor.setLength(0);
            } else if (ch == '\n' || ch == '\r') {
                if (ch == '\r' && i + 1 < contenido.length() && contenido.charAt(i + 1) == '\n') {
                    i++;
                }
                fila.add(valor.toString().trim());
                valor.setLength(0);
                tabla.add(fila);
                fila = new ArrayList<>();
            } else {
                valor.append(ch);
            }
        }
        if (valor.length() > 0 || !fila.isEmpty()) {
            fila.add(valor.toString().trim());
            tabla.add(fila);
        }
        return tabla;
    }

    /**
     * Toma los valores de una fila según los encabezados.
     */
    private CargaInventarioDetalle leerFila(List<String> fila, Map<String, Integer> indice, int numero) {
        CargaInventarioDetalle d = new CargaInventarioDetalle();
        d.setFila(numero);
        d.setCodigo(this.valor(fila, indice, "codigo", 50));
        d.setNombre(this.valor(fila, indice, "nombre", 150));
        d.setTipo(this.valor(fila, indice, "tipo", 30));
        d.setPresentacion(this.valor(fila, indice, "presentacion", 150));
        d.setDescripcion(this.valor(fila, indice, "descripcion", 500));
        d.setRegistroInvima(this.valor(fila, indice, "registro_invima", 50));
        d.setPrecioVenta(this.valor(fila, indice, "precio_venta", 30));
        d.setIva(this.valor(fila, indice, "iva", 30));
        d.setStockMinimo(this.valor(fila, indice, "stock_minimo", 30));
        d.setNumeroLote(this.valor(fila, indice, "numero_lote", 50));
        d.setFechaCompra(this.valor(fila, indice, "fecha_compra", 30));
        d.setFechaVencimiento(this.valor(fila, indice, "fecha_vencimiento", 30));
        d.setCantidad(this.valor(fila, indice, "cantidad", 30));
        d.setPrecioCompra(this.valor(fila, indice, "precio_compra", 30));
        return d;
    }

    private String valor(List<String> fila, Map<String, Integer> indice, String columna, int maximo) {
        Integer i = indice.get(columna);
        String v = i == null || i >= fila.size() || fila.get(i) == null ? "" : fila.get(i).trim();
        return v.length() > maximo ? v.substring(0, maximo) : v;
    }

    // ===================== Validación de una fila =====================

    /**
     * Valida los datos de una fila con las reglas del inventario.
     *
     * @param d fila.
     * @return lista de errores (vacía si es válida).
     */
    private List<String> validarFila(CargaInventarioDetalle d) {
        List<String> e = new ArrayList<>();
        String codigo = d.getCodigo() == null ? "" : d.getCodigo().toUpperCase(Locale.ROOT);
        if (codigo.isBlank()) {
            e.add("el código es obligatorio");
        } else if (!CODIGO.matcher(codigo).matches()) {
            e.add("el código debe tener exactamente 8 letras o números");
        }
        if (vacio(d.getNombre())) {
            e.add("el nombre es obligatorio");
        } else if (d.getNombre().length() > 100) {
            e.add("el nombre supera 100 caracteres");
        }
        String tipo = d.getTipo() == null ? "" : d.getTipo().trim().toUpperCase(Locale.ROOT);
        boolean medicamento = "MEDICAMENTO".equals(tipo);
        if (!medicamento && !"INSUMO".equals(tipo)) {
            e.add("el tipo debe ser MEDICAMENTO o INSUMO");
        }
        if (medicamento && vacio(d.getRegistroInvima())) {
            e.add("el registro Invima es obligatorio para los medicamentos");
        } else if (!vacio(d.getRegistroInvima()) && !INVIMA.matcher(d.getRegistroInvima().trim()).matches()) {
            e.add("el registro Invima debe tener de 5 a 30 letras, números, guiones o barras");
        }
        this.validarDecimal(d.getPrecioVenta(), "el precio de venta", true, true, e);
        if (!vacio(d.getIva())) {
            BigDecimal iva = this.validarDecimal(d.getIva(), "el IVA", false, false, e);
            if (iva != null && iva.compareTo(BigDecimal.valueOf(100)) > 0) {
                e.add("el IVA no puede superar 100 %");
            }
        }
        Integer minimo = this.validarEntero(d.getStockMinimo(), "el stock mínimo", true, e);
        if (minimo != null && minimo < 0) {
            e.add("el stock mínimo no puede ser negativo");
        }

        boolean traeLote = !vacio(d.getNumeroLote()) || !vacio(d.getCantidad()) || !vacio(d.getPrecioCompra())
                || !vacio(d.getFechaCompra()) || !vacio(d.getFechaVencimiento());
        if (medicamento && !traeLote) {
            e.add("un medicamento debe traer su lote (número, fechas, cantidad y precio de compra)");
        }
        if (traeLote) {
            if (vacio(d.getNumeroLote())) {
                e.add("falta el número de lote");
            } else if (!LOTE.matcher(d.getNumeroLote().trim()).matches()) {
                e.add("el número de lote solo admite letras, números y guiones (máximo 40)");
            }
            Integer cantidad = this.validarEntero(d.getCantidad(), "la cantidad", true, e);
            if (cantidad != null && (cantidad < 1 || cantidad > 1_000_000)) {
                e.add("la cantidad debe estar entre 1 y 1.000.000");
            }
            this.validarDecimal(d.getPrecioCompra(), "el precio de compra", true, true, e);
            LocalDate hoy = LocalDate.now();
            LocalDate compra = this.validarFecha(d.getFechaCompra(), "la fecha de compra", true, e);
            if (compra != null && compra.isAfter(hoy)) {
                e.add("la fecha de compra no puede ser futura");
            }
            LocalDate vence = this.validarFecha(d.getFechaVencimiento(), "la fecha de vencimiento", medicamento, e);
            if (vence != null && !vence.isAfter(hoy)) {
                e.add("el lote está vencido o vence hoy");
            }
            if (vence != null && compra != null && !vence.isAfter(compra)) {
                e.add("la fecha de vencimiento debe ser posterior a la de compra");
            }
        }
        return e;
    }

    private BigDecimal validarDecimal(String v, String nombre, boolean obligatorio, boolean positivo, List<String> e) {
        if (vacio(v)) {
            if (obligatorio) {
                e.add(nombre + " es obligatorio");
            }
            return null;
        }
        try {
            BigDecimal d = decimal(v);
            if (positivo ? d.signum() <= 0 : d.signum() < 0) {
                e.add(nombre + (positivo ? " debe ser mayor que 0" : " no puede ser negativo"));
            } else if (d.stripTrailingZeros().scale() > 2) {
                e.add(nombre + " admite máximo dos decimales");
            } else if (d.compareTo(new BigDecimal("999999999.99")) > 0) {
                e.add(nombre + " supera el valor máximo");
            }
            return d;
        } catch (NumberFormatException ex) {
            e.add(nombre + " no es un número válido (" + v + ")");
            return null;
        }
    }

    private Integer validarEntero(String v, String nombre, boolean obligatorio, List<String> e) {
        if (vacio(v)) {
            if (obligatorio) {
                e.add(nombre + " es obligatorio");
            }
            return null;
        }
        try {
            return entero(v);
        } catch (NumberFormatException | ArithmeticException ex) {
            e.add(nombre + " debe ser un número entero (" + v + ")");
            return null;
        }
    }

    private LocalDate validarFecha(String v, String nombre, boolean obligatorio, List<String> e) {
        if (vacio(v)) {
            if (obligatorio) {
                e.add(nombre + " es obligatoria");
            }
            return null;
        }
        try {
            return fecha(v);
        } catch (DateTimeParseException ex) {
            e.add(nombre + " no tiene un formato válido (use AAAA-MM-DD o DD/MM/AAAA)");
            return null;
        }
    }

    // ===================== Conversión =====================

    private static boolean vacio(String v) {
        return v == null || v.isBlank();
    }

    private static String vacioANull(String v) {
        return vacio(v) ? null : v.trim();
    }

    private static String texto(String v) {
        return v == null ? "" : v;
    }

    /**
     * Convierte un número escrito como 1500, 1500.50, 1.500,50 o 1500,5.
     */
    private static BigDecimal decimal(String v) {
        String s = v.trim().replace(" ", "").replace("$", "");
        if (s.contains(",") && s.contains(".")) {
            s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(".", "").replace(',', '.') : s.replace(",", "");
        } else if (s.contains(",")) {
            s = s.replace(',', '.');
        }
        return new BigDecimal(s);
    }

    private static Integer entero(String v) {
        return decimal(v).intValueExact();
    }

    private static LocalDate fecha(String v) {
        String s = v.trim();
        if (s.length() > 10 && s.charAt(10) == 'T') {
            s = s.substring(0, 10);
        }
        for (DateTimeFormatter f : FORMATOS_FECHA) {
            try {
                return LocalDate.parse(s, f);
            } catch (DateTimeParseException ignorada) {
                // Se prueba el siguiente formato.
            }
        }
        throw new DateTimeParseException("Fecha inválida", s, 0);
    }

    /**
     * Normaliza un encabezado: minúsculas, sin tildes y con guiones bajos.
     */
    private static String normalizarEncabezado(String h) {
        String s = Normalizer.normalize(h == null ? "" : h, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return s.trim().toLowerCase(Locale.ROOT).replace('﻿', ' ').trim().replaceAll("[\\s.-]+", "_");
    }

    private CellStyle estiloCabecera(XSSFWorkbook libro) {
        Font f = libro.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.WHITE.getIndex());
        CellStyle s = libro.createCellStyle();
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return s;
    }

    private CargaInventario buscar(Long cargaId) {
        return cargaRepository.findById(cargaId).orElseThrow(() -> new NotFoundException("La carga no existe"));
    }

    /**
     * Convierte una carga en respuesta.
     *
     * @param filas filas a incluir (null = solo el resumen).
     */
    private CargaRs convertir(CargaInventario c, List<CargaInventarioDetalle> filas) {
        CargaRs rs = new CargaRs();
        rs.setCargaId(c.getCargaId());
        rs.setArchivo(c.getArchivo());
        rs.setFormato(c.getFormato());
        rs.setUsuario(c.getUsuario().getUsername());
        rs.setFecha(c.getFecha());
        rs.setEstado(c.getEstado());
        rs.setTotalFilas(c.getTotalFilas());
        rs.setFilasValidas(c.getFilasValidas());
        rs.setFilasError(c.getFilasError());
        rs.setFilasImportadas(c.getFilasImportadas());
        rs.setFechaConfirmacion(c.getFechaConfirmacion());
        if (filas != null) {
            Map<Integer, CargaRs.Fila> lista = new LinkedHashMap<>();
            for (CargaInventarioDetalle d : filas) {
                CargaRs.Fila f = new CargaRs.Fila();
                f.setFila(d.getFila());
                f.setCodigo(d.getCodigo());
                f.setNombre(d.getNombre());
                f.setTipo(d.getTipo());
                f.setPrecioVenta(d.getPrecioVenta());
                f.setNumeroLote(d.getNumeroLote());
                f.setCantidad(d.getCantidad());
                f.setFechaVencimiento(d.getFechaVencimiento());
                f.setEstado(d.getEstado());
                f.setMensaje(d.getMensaje());
                f.setMedicamentoId(d.getMedicamentoId());
                lista.put(d.getFila(), f);
            }
            rs.setFilas(new ArrayList<>(lista.values()));
        }
        return rs;
    }
}
