package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.RazaRepository;
import com.uniminuto.clinica.service.MascotaService;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementación de las reglas de negocio de las mascotas: el dueño debe ser
 * un cliente registrado y activo, la raza debe existir, la edad debe ser
 * razonable, un cliente no repite nombres de mascota y el dueño no cambia al
 * editar (la mascota arrastra sus citas e historias).
 */
@Service
public class MascotaServiceImpl implements MascotaService {

    /**
     * Edad máxima aceptada, en años.
     */
    private static final int EDAD_MAXIMA = 40;

    /**
     * Identificador que no existe, para reutilizar la consulta "IdNot" al crear.
     */
    private static final Integer SIN_ID = -1;

    /**
     * Repositorio de mascotas.
     */
    @Autowired
    private MascotaRepository mascotaRepository;

    /**
     * Repositorio de clientes.
     */
    @Autowired
    private ClienteRepository clienteRepository;

    /**
     * Repositorio de razas.
     */
    @Autowired
    private RazaRepository razaRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Mascota> listarMascotas() {
        return mascotaRepository.findAllByOrderByNombreMascotaAsc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Mascota> listarMascotasPorCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("El cliente no existe"));
        return mascotaRepository.findAllByClienteOrderByNombreMascotaAsc(cliente);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Mascota> listarMascotasPorRaza(Integer razaId) {
        Raza raza = razaRepository.findById(razaId)
                .orElseThrow(() -> new NotFoundException("La raza no existe"));
        return mascotaRepository.findAllByRazaOrderByNombreMascotaAsc(raza);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Mascota consultarMascota(Integer mascotaId) {
        return mascotaRepository.findById(mascotaId)
                .orElseThrow(() -> new NotFoundException("La mascota no existe"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarMascota(MascotaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la mascota");
        }
        if (rq.getClienteId() == null) {
            throw new BadRequestException("Debe seleccionar el dueño de la mascota");
        }
        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new NotFoundException("El cliente seleccionado no existe"));
        if (!Boolean.TRUE.equals(cliente.getActivo())) {
            throw new ConflictException("El cliente está inactivo y no puede registrar mascotas");
        }

        Mascota mascota = new Mascota();
        mascota.setCliente(cliente);
        this.aplicarDatos(mascota, rq, cliente.getClienteId(), SIN_ID);
        mascota.setFechaRegistro(LocalDateTime.now());
        mascotaRepository.save(mascota);
        return MiRespuestaRS.de(201, "Mascota registrada correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarMascota(Integer mascotaId, MascotaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos de la mascota");
        }
        Mascota mascota = this.consultarMascota(mascotaId);
        this.aplicarDatos(mascota, rq, mascota.getCliente().getClienteId(), mascotaId);
        mascota.setFechaModificacion(LocalDateTime.now());
        mascotaRepository.save(mascota);
        return MiRespuestaRS.de(200, "Mascota actualizada correctamente");
    }

    /**
     * Valida nombre, edad y raza (incluido el nombre repetido, antes de
     * modificar la entidad) y los copia a la mascota.
     *
     * @param mascota   mascota a completar.
     * @param rq        datos recibidos.
     * @param clienteId dueño de la mascota.
     * @param mascotaId mascota que se edita (SIN_ID al crear).
     */
    private void aplicarDatos(Mascota mascota, MascotaRq rq, Long clienteId, Integer mascotaId) {
        String nombre = Validaciones.conPatron(rq.getNombreMascota(), "El nombre de la mascota", 100,
                Validaciones.SOLO_LETRAS, "El nombre de la mascota solo puede contener letras");
        if (rq.getEdad() == null || rq.getEdad() < 0 || rq.getEdad() > EDAD_MAXIMA) {
            throw new BadRequestException("La edad debe ser un número entero entre 0 y " + EDAD_MAXIMA + " años");
        }
        if (rq.getRazaId() == null) {
            throw new BadRequestException("Debe seleccionar la raza");
        }
        Raza raza = razaRepository.findById(rq.getRazaId())
                .orElseThrow(() -> new NotFoundException("La raza seleccionada no existe"));
        if (mascotaRepository.existsByCliente_ClienteIdAndNombreMascotaIgnoreCaseAndMascotaIdNot(
                clienteId, nombre, mascotaId)) {
            throw new ConflictException("El cliente ya tiene una mascota llamada " + nombre);
        }

        mascota.setNombreMascota(nombre);
        mascota.setEdad(rq.getEdad());
        mascota.setRaza(raza);
    }
}
