package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.EstadoCita;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.service.ClienteService;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Implementación de las reglas de negocio de los clientes. Un cliente no se
 * elimina (dejaría mascotas, citas e historias huérfanas): se inactiva, y
 * mientras esté inactivo no se edita ni puede agendar citas.
 */
@Service
public class ClienteServiceImpl implements ClienteService {

    /**
     * Tipos de documento aceptados.
     */
    private static final List<String> TIPOS_DOCUMENTO = List.of("CC", "CE", "TI", "PA", "NIT");

    /**
     * Géneros aceptados (opcional).
     */
    private static final List<String> GENEROS = List.of("M", "F", "O");

    /**
     * Número de documento: 5 a 20 letras o números.
     */
    private static final Pattern DOCUMENTO = Pattern.compile("^[A-Z0-9]{5,20}$");

    /**
     * Teléfono: 7 a 20 dígitos, espacios y "+" inicial.
     */
    private static final Pattern TELEFONO = Pattern.compile("^\\+?[0-9 ]{7,20}$");

    /**
     * Estados de cita que impiden inactivar al cliente si la cita es futura.
     */
    private static final List<EstadoCita> CITAS_POR_ATENDER =
            List.of(EstadoCita.PENDIENTE, EstadoCita.PROGRAMADA, EstadoCita.CONFIRMADA);

    /**
     * Repositorio de clientes.
     */
    @Autowired
    private ClienteRepository clienteRepository;

    /**
     * Repositorio de citas (para validar la inactivación).
     */
    @Autowired
    private CitaRepository citaRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Cliente> listarClientes(boolean soloActivos) {
        return clienteRepository
                .findAll(Sort.by("nombres").ascending().and(Sort.by("apellidos")))
                .stream()
                .filter(cliente -> !soloActivos || Boolean.TRUE.equals(cliente.getActivo()))
                .toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Cliente consultarCliente(Long clienteId) {
        return clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("El cliente no existe"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarCliente(ClienteRq rq) {
        Cliente cliente = new Cliente();
        this.aplicarDatos(cliente, rq);
        if (clienteRepository.existsByTipoDocumentoAndNumeroDocumento(
                cliente.getTipoDocumento(), cliente.getNumeroDocumento())) {
            throw new ConflictException("Ya existe un cliente con el documento "
                    + cliente.getTipoDocumento() + " " + cliente.getNumeroDocumento());
        }
        cliente.setActivo(true);
        clienteRepository.save(cliente);
        return MiRespuestaRS.de(201, "Cliente registrado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarCliente(Long clienteId, ClienteRq rq) {
        Cliente cliente = this.consultarCliente(clienteId);
        if (!Boolean.TRUE.equals(cliente.getActivo())) {
            throw new ConflictException("El cliente está inactivo; actívelo antes de modificarlo");
        }
        // Se valida sobre una copia: si se modificara la entidad antes de la consulta de
        // duplicados, Hibernate la guardaría primero y fallaría la restricción única.
        Cliente datos = new Cliente();
        this.aplicarDatos(datos, rq);
        if (clienteRepository.existsByTipoDocumentoAndNumeroDocumentoAndClienteIdNot(
                datos.getTipoDocumento(), datos.getNumeroDocumento(), clienteId)) {
            throw new ConflictException("Otro cliente ya tiene el documento "
                    + datos.getTipoDocumento() + " " + datos.getNumeroDocumento());
        }
        this.aplicarDatos(cliente, rq);
        clienteRepository.save(cliente);
        return MiRespuestaRS.de(200, "Cliente actualizado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Long clienteId, boolean activar) {
        Cliente cliente = this.consultarCliente(clienteId);
        if (Boolean.valueOf(activar).equals(cliente.getActivo())) {
            throw new ConflictException(activar ? "El cliente ya está activo" : "El cliente ya está inactivo");
        }
        if (!activar && citaRepository.existsByMascota_Cliente_ClienteIdAndEstadoInAndFechaHoraAfter(
                clienteId, CITAS_POR_ATENDER, LocalDateTime.now())) {
            throw new ConflictException("El cliente tiene citas por atender; cancélelas antes de inactivarlo");
        }
        cliente.setActivo(activar);
        clienteRepository.save(cliente);
        return MiRespuestaRS.de(200, activar ? "Cliente activado correctamente" : "Cliente inactivado correctamente");
    }

    /**
     * Valida los datos recibidos y los copia al cliente.
     *
     * @param cliente cliente a completar.
     * @param rq      datos recibidos.
     */
    private void aplicarDatos(Cliente cliente, ClienteRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del cliente");
        }
        String tipo = Validaciones.obligatorio(rq.getTipoDocumento(), "El tipo de documento", 10).toUpperCase();
        if (!TIPOS_DOCUMENTO.contains(tipo)) {
            throw new BadRequestException("El tipo de documento no es válido. Use: " + String.join(", ", TIPOS_DOCUMENTO));
        }
        String numero = Validaciones.conPatron(
                rq.getNumeroDocumento() == null ? null : rq.getNumeroDocumento().toUpperCase(),
                "El número de documento", 20, DOCUMENTO,
                "El número de documento debe tener entre 5 y 20 letras o números, sin espacios ni puntos");
        String nombres = Validaciones.conPatron(rq.getNombres(), "El nombre", 100,
                Validaciones.SOLO_LETRAS, "El nombre solo puede contener letras");
        String apellidos = Validaciones.conPatron(rq.getApellidos(), "El apellido", 100,
                Validaciones.SOLO_LETRAS, "El apellido solo puede contener letras");
        if (rq.getFechaNacimiento() == null) {
            throw new BadRequestException("La fecha de nacimiento es obligatoria");
        }
        if (rq.getFechaNacimiento().isAfter(LocalDate.now())) {
            throw new BadRequestException("La fecha de nacimiento no puede ser futura");
        }
        String genero = Validaciones.opcional(rq.getGenero(), "El género", 1);
        if (genero != null && !GENEROS.contains(genero.toUpperCase())) {
            throw new BadRequestException("El género no es válido. Use M, F u O");
        }
        String telefono = Validaciones.conPatron(rq.getTelefono(), "El teléfono", 20, TELEFONO,
                "El teléfono debe tener entre 7 y 20 dígitos");

        cliente.setTipoDocumento(tipo);
        cliente.setNumeroDocumento(numero);
        cliente.setNombres(nombres);
        cliente.setApellidos(apellidos);
        cliente.setFechaNacimiento(rq.getFechaNacimiento());
        cliente.setGenero(genero == null ? null : genero.toUpperCase());
        cliente.setTelefono(telefono);
        cliente.setDireccion(Validaciones.opcional(rq.getDireccion(), "La dirección", 255));
    }
}
