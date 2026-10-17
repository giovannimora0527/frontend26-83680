package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.CitaFiltroRq;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.CitaSpecification;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Implementación de las reglas de negocio de las citas médicas.
 * <p>
 * Todas las reglas críticas se validan aquí, en el backend, sin depender de
 * lo que haga el formulario de Angular.
 * </p>
 */
@Service
public class CitaServiceImpl implements CitaService {

    /**
     * Minutos de margen antes y después de una cita en los que el veterinario
     * y la mascota no pueden tener otra cita.
     */
    private static final int MINUTOS_MARGEN = 15;

    /**
     * Tamaño máximo de página permitido.
     */
    private static final int TAMANO_MAXIMO_PAGINA = 100;

    /**
     * Longitud máxima del motivo de la consulta.
     */
    private static final int LONGITUD_MAXIMA_MOTIVO = 500;

    /**
     * Valor usado como "cita a ignorar" cuando se valida una cita nueva.
     */
    private static final Long SIN_CITA = -1L;

    /**
     * Columnas por las que el usuario puede ordenar y su campo real en la entidad.
     */
    private static final Map<String, String> CAMPOS_ORDEN = Map.of(
            "fecha", "fechaHora",
            "hora", "fechaHora",
            "cliente", "mascota.cliente.nombres",
            "mascota", "mascota.nombreMascota",
            "medico", "medico.nombres",
            "estado", "estado");

    /**
     * Repositorio de citas.
     */
    @Autowired
    private CitaRepository citaRepository;

    /**
     * Repositorio de clientes.
     */
    @Autowired
    private ClienteRepository clienteRepository;

    /**
     * Repositorio de mascotas.
     */
    @Autowired
    private MascotaRepository mascotaRepository;

    /**
     * Repositorio de veterinarios.
     */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<CitaRs> listarCitas(CitaFiltroRq filtro) {
        if (filtro.getPage() < 0) {
            throw new BadRequestException("La página no puede ser negativa");
        }
        if (filtro.getSize() < 1 || filtro.getSize() > TAMANO_MAXIMO_PAGINA) {
            throw new BadRequestException("El tamaño de página debe estar entre 1 y "
                    + TAMANO_MAXIMO_PAGINA);
        }
        if (filtro.getDesde() != null && filtro.getHasta() != null
                && filtro.getDesde().isAfter(filtro.getHasta())) {
            throw new BadRequestException(
                    "La fecha inicial no puede ser posterior a la fecha final");
        }

        EstadoCita estado = null;
        if (filtro.getEstado() != null && !filtro.getEstado().isBlank()) {
            estado = this.convertirEstado(filtro.getEstado());
        }

        Pageable pageable = PageRequest.of(
                filtro.getPage(),
                filtro.getSize(),
                this.construirOrden(filtro.getOrden(), filtro.getDireccion()));

        Page<CitaRs> pagina = citaRepository
                .findAll(CitaSpecification.conFiltros(
                        filtro.getTexto(),
                        estado,
                        filtro.getMedicoId(),
                        filtro.getClienteId(),
                        filtro.getMascotaId(),
                        filtro.getDesde(),
                        filtro.getHasta()), pageable)
                .map(this::convertirARespuesta);

        return PaginaRs.desde(pagina);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public CitaRs consultarCita(Long citaId) {
        return this.convertirARespuesta(this.buscarCita(citaId));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarCita(CitaRq citaRq) {
        // Paso 1. Validar los datos obligatorios de entrada.
        this.validarDatosObligatorios(citaRq, true);

        // Paso 2. Buscar cliente, mascota y veterinario.
        Cliente cliente = this.buscarCliente(citaRq.getClienteId());
        Mascota mascota = this.buscarMascota(citaRq.getMascotaId());
        Medico medico = this.buscarMedico(citaRq.getMedicoId());

        // Paso 3. La mascota debe pertenecer al cliente seleccionado.
        if (!mascota.getCliente().getClienteId().equals(cliente.getClienteId())) {
            throw new BadRequestException(
                    "La mascota seleccionada no pertenece al cliente");
        }

        // Paso 4. Fecha futura y estado inicial válido.
        LocalDateTime fechaHora = this.combinarFechaHora(citaRq);
        this.validarQueNoSeaPasada(fechaHora);

        EstadoCita estado = this.convertirEstado(citaRq.getEstado());
        if (estado != EstadoCita.PENDIENTE
                && estado != EstadoCita.PROGRAMADA
                && estado != EstadoCita.CONFIRMADA) {
            throw new BadRequestException(
                    "Una cita nueva solo puede quedar Pendiente, Programada o Confirmada");
        }

        // Paso 5. Disponibilidad del veterinario y de la mascota.
        this.validarDisponibilidad(medico.getId(), mascota.getMascotaId(),
                fechaHora, SIN_CITA, true, true);

        // Paso 6. Guardar.
        Cita cita = new Cita();
        cita.setMascota(mascota);
        cita.setMedico(medico);
        cita.setFechaHora(fechaHora);
        cita.setMotivo(citaRq.getMotivo().trim());
        cita.setEstado(estado);
        cita.setFechaCreacion(LocalDateTime.now());
        citaRepository.save(cita);

        return this.crearRespuesta(201, "Cita registrada correctamente");
    }

    /**
     * {@inheritDoc}
     * <p>
     * Una cita ATENDIDA o CANCELADA no se puede editar. Cuando el nuevo estado
     * es ATENDIDA o CANCELADA solo cambia el estado: los demás datos se
     * conservan para no alterar el historial.
     * </p>
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarCita(Long citaId, CitaRq citaRq) {
        // Paso 1. Buscar la cita y revisar si su estado permite editarla.
        Cita cita = this.buscarCita(citaId);

        if (cita.getEstado() == EstadoCita.ATENDIDA) {
            throw new ConflictException("La cita ya fue atendida y hace parte del "
                    + "historial clínico; no se puede modificar");
        }
        if (cita.getEstado() == EstadoCita.CANCELADA) {
            throw new ConflictException("La cita está cancelada y no se puede "
                    + "modificar. Para activarla de nuevo use la opción de reactivar");
        }

        // Paso 2. Validar datos y que no se cambie el cliente ni la mascota.
        this.validarDatosObligatorios(citaRq, false);
        if (citaRq.getMascotaId() != null && !citaRq.getMascotaId()
                .equals(cita.getMascota().getMascotaId())) {
            throw new BadRequestException(
                    "No se puede cambiar la mascota de una cita ya registrada");
        }
        if (citaRq.getClienteId() != null && !citaRq.getClienteId()
                .equals(cita.getMascota().getCliente().getClienteId())) {
            throw new BadRequestException(
                    "No se puede cambiar el cliente de una cita ya registrada");
        }

        // Paso 3. Validar la transición de estado.
        EstadoCita destino = this.convertirEstado(citaRq.getEstado());
        if (!cita.getEstado().puedePasarA(destino)) {
            throw new ConflictException("No se puede pasar una cita de "
                    + cita.getEstado() + " a " + destino);
        }

        if (destino.esFinal()) {
            // Una cita solo se atiende cuando ya ocurrió: si no, su historia clínica y sus
            // fórmulas quedarían con fechas futuras imposibles de cumplir.
            if (destino == EstadoCita.ATENDIDA && cita.getEstado() != EstadoCita.ATENDIDA
                    && cita.getFechaHora().isAfter(LocalDateTime.now())) {
                throw new ConflictException("No se puede marcar como atendida una cita que aún no "
                        + "ha ocurrido (" + cita.getFechaHora().toLocalDate() + " "
                        + cita.getFechaHora().toLocalTime() + ")");
            }
            // Atender o cancelar: solo cambia el estado.
            cita.setEstado(destino);
        } else {
            // Paso 4. Cambios de veterinario, fecha, hora y motivo.
            Medico medico = this.buscarMedico(citaRq.getMedicoId());
            LocalDateTime nuevaFechaHora = this.combinarFechaHora(citaRq);

            boolean cambioHorario = !nuevaFechaHora.equals(
                    cita.getFechaHora().truncatedTo(ChronoUnit.MINUTES));
            boolean cambioMedico = !medico.getId().equals(cita.getMedico().getId());

            if (cambioHorario) {
                this.validarQueNoSeaPasada(nuevaFechaHora);
            }
            if (cambioHorario || cambioMedico) {
                this.validarDisponibilidad(medico.getId(),
                        cita.getMascota().getMascotaId(), nuevaFechaHora,
                        cita.getCitaId(), true, cambioHorario);
            }

            cita.setMedico(medico);
            cita.setFechaHora(nuevaFechaHora);
            cita.setMotivo(citaRq.getMotivo().trim());
            cita.setEstado(destino);
        }

        // Paso 5. Guardar.
        cita.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(cita);

        return this.crearRespuesta(200, "Cita actualizada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS reactivarCita(Long citaId) {
        Cita cita = this.buscarCita(citaId);

        if (cita.getEstado() != EstadoCita.CANCELADA) {
            throw new ConflictException("Solo se pueden reactivar citas canceladas");
        }

        LocalDateTime fechaHora = cita.getFechaHora().truncatedTo(ChronoUnit.MINUTES);
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("La fecha de la cita ya pasó; "
                    + "registre una cita nueva");
        }

        // El horario pudo ser ocupado mientras la cita estaba cancelada.
        this.validarDisponibilidad(cita.getMedico().getId(),
                cita.getMascota().getMascotaId(), fechaHora,
                cita.getCitaId(), true, true);

        cita.setEstado(EstadoCita.PENDIENTE);
        cita.setFechaModificacion(LocalDateTime.now());
        citaRepository.save(cita);

        return this.crearRespuesta(200, "Cita reactivada correctamente");
    }

    /**
     * Valida los datos que deben venir siempre en la solicitud.
     *
     * @param citaRq   solicitud a validar.
     * @param creacion true si se está creando (exige cliente y mascota).
     */
    private void validarDatosObligatorios(CitaRq citaRq, boolean creacion) {
        if (citaRq == null) {
            throw new BadRequestException("Debe enviar los datos de la cita");
        }
        if (creacion && citaRq.getClienteId() == null) {
            throw new BadRequestException("Debe seleccionar un cliente");
        }
        if (creacion && citaRq.getMascotaId() == null) {
            throw new BadRequestException("Debe seleccionar una mascota");
        }
        if (citaRq.getMedicoId() == null) {
            throw new BadRequestException("Debe seleccionar un veterinario");
        }
        if (citaRq.getFecha() == null) {
            throw new BadRequestException("Debe indicar la fecha de la cita");
        }
        if (citaRq.getHora() == null) {
            throw new BadRequestException("Debe indicar la hora de la cita");
        }
        if (citaRq.getMotivo() == null || citaRq.getMotivo().isBlank()) {
            throw new BadRequestException("El motivo de la consulta es obligatorio");
        }
        if (citaRq.getMotivo().trim().length() > LONGITUD_MAXIMA_MOTIVO) {
            throw new BadRequestException("El motivo no puede superar los "
                    + LONGITUD_MAXIMA_MOTIVO + " caracteres");
        }
        if (citaRq.getEstado() == null || citaRq.getEstado().isBlank()) {
            throw new BadRequestException("Debe indicar el estado de la cita");
        }
    }

    /**
     * Verifica que el veterinario y la mascota no tengan otra cita activa
     * dentro del margen de {@value #MINUTOS_MARGEN} minutos antes y después.
     * Las citas canceladas no ocupan horario.
     *
     * @param medicoId        veterinario de la cita.
     * @param mascotaId       mascota de la cita.
     * @param fechaHora       fecha y hora de la cita.
     * @param citaIdExcluido  cita a ignorar (la que se edita) o {@link #SIN_CITA}.
     * @param validarMedico   si se debe revisar al veterinario.
     * @param validarMascota  si se debe revisar a la mascota.
     */
    private void validarDisponibilidad(Long medicoId, Integer mascotaId,
                                       LocalDateTime fechaHora, Long citaIdExcluido,
                                       boolean validarMedico, boolean validarMascota) {
        LocalDateTime desde = fechaHora.minusMinutes(MINUTOS_MARGEN);
        LocalDateTime hasta = fechaHora.plusMinutes(MINUTOS_MARGEN);

        if (validarMedico && citaRepository.contarCitasDelMedicoEnRango(
                medicoId, EstadoCita.CANCELADA, desde, hasta, citaIdExcluido) > 0) {
            throw new ConflictException("El veterinario no está disponible en ese "
                    + "horario. Debe haber al menos " + MINUTOS_MARGEN
                    + " minutos entre una cita y otra");
        }
        if (validarMascota && citaRepository.contarCitasDeLaMascotaEnRango(
                mascotaId, EstadoCita.CANCELADA, desde, hasta, citaIdExcluido) > 0) {
            throw new ConflictException(
                    "La mascota ya tiene una cita en ese horario");
        }
    }

    /**
     * Verifica que la fecha y hora no sean anteriores al momento actual.
     *
     * @param fechaHora fecha y hora a validar.
     */
    private void validarQueNoSeaPasada(LocalDateTime fechaHora) {
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "No se pueden registrar citas en fechas anteriores a la fecha actual");
        }
    }

    /**
     * Une la fecha y la hora de la solicitud en un solo valor, sin segundos.
     *
     * @param citaRq solicitud con fecha y hora.
     * @return fecha y hora truncadas al minuto.
     */
    private LocalDateTime combinarFechaHora(CitaRq citaRq) {
        return LocalDateTime.of(citaRq.getFecha(), citaRq.getHora())
                .truncatedTo(ChronoUnit.MINUTES);
    }

    /**
     * Convierte el texto recibido en un estado de cita.
     *
     * @param texto nombre del estado, sin importar mayúsculas.
     * @return el estado correspondiente.
     */
    private EstadoCita convertirEstado(String texto) {
        try {
            return EstadoCita.valueOf(texto.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("El estado '" + texto + "' no es válido. "
                    + "Use Pendiente, Confirmada, Atendida, Cancelada o Programada");
        }
    }

    /**
     * Construye el ordenamiento solicitado. Si la columna no es válida o no se
     * envía, ordena por fecha y hora de forma descendente.
     *
     * @param orden     columna elegida por el usuario.
     * @param direccion asc o desc.
     * @return ordenamiento para la consulta.
     */
    private Sort construirOrden(String orden, String direccion) {
        String campo = CAMPOS_ORDEN.getOrDefault(
                orden == null ? "" : orden.trim().toLowerCase(), "fechaHora");
        Sort.Direction sentido = "asc".equalsIgnoreCase(direccion)
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(sentido, campo).and(Sort.by(sentido, "citaId"));
    }

    /**
     * Busca una cita o lanza un error 404 si no existe.
     *
     * @param citaId identificador de la cita.
     * @return la cita encontrada.
     */
    private Cita buscarCita(Long citaId) {
        return citaRepository.findById(citaId)
                .orElseThrow(() -> new NotFoundException("La cita no existe"));
    }

    /**
     * Busca un cliente activo: 404 si no existe y 409 si está inactivo, porque
     * un cliente inactivo no puede agendar citas nuevas.
     *
     * @param clienteId identificador del cliente.
     * @return el cliente encontrado.
     */
    private Cliente buscarCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException(
                        "El cliente seleccionado no existe"));
        if (!Boolean.TRUE.equals(cliente.getActivo())) {
            throw new ConflictException("El cliente está inactivo y no puede agendar citas");
        }
        return cliente;
    }

    /**
     * Busca una mascota o lanza un error 404 si no existe.
     *
     * @param mascotaId identificador de la mascota.
     * @return la mascota encontrada.
     */
    private Mascota buscarMascota(Integer mascotaId) {
        return mascotaRepository.findById(mascotaId)
                .orElseThrow(() -> new NotFoundException(
                        "La mascota seleccionada no existe"));
    }

    /**
     * Busca un veterinario o lanza un error 404 si no existe.
     *
     * @param medicoId identificador del veterinario.
     * @return el veterinario encontrado.
     */
    private Medico buscarMedico(Long medicoId) {
        return medicoRepository.findById(medicoId)
                .orElseThrow(() -> new NotFoundException(
                        "El veterinario seleccionado no existe"));
    }

    /**
     * Convierte una cita de la base de datos en la respuesta que ve el cliente.
     *
     * @param cita cita a convertir.
     * @return respuesta con los datos de la cita.
     */
    private CitaRs convertirARespuesta(Cita cita) {
        Mascota mascota = cita.getMascota();
        Cliente cliente = mascota.getCliente();
        Medico medico = cita.getMedico();

        CitaRs rs = new CitaRs();
        rs.setCitaId(cita.getCitaId());
        rs.setFecha(cita.getFechaHora().toLocalDate());
        rs.setHora(cita.getFechaHora().toLocalTime());
        rs.setClienteId(cliente.getClienteId());
        rs.setClienteNombre(cliente.getNombres() + " " + cliente.getApellidos());
        rs.setMascotaId(mascota.getMascotaId());
        rs.setMascotaNombre(mascota.getNombreMascota());
        rs.setMedicoId(medico.getId());
        rs.setMedicoNombre(medico.getNombres() + " " + medico.getApellidos());
        rs.setMotivo(cita.getMotivo());
        rs.setEstado(cita.getEstado().name());
        rs.setFechaCreacion(cita.getFechaCreacion());
        rs.setFechaModificacion(cita.getFechaModificacion());
        return rs;
    }

    /**
     * Crea la respuesta estándar de las operaciones de escritura.
     *
     * @param status  código HTTP que se informa en el cuerpo.
     * @param mensaje mensaje para el usuario.
     * @return la respuesta lista para enviar.
     */
    private MiRespuestaRS crearRespuesta(int status, String mensaje) {
        MiRespuestaRS rta = new MiRespuestaRS();
        rta.setStatus(status);
        rta.setMessage(mensaje);
        return rta;
    }
}
