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
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class MascotaServiceImpl implements MascotaService {

    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private RazaRepository razaRepository;

    @Override
    public List<Mascota> listarMascotas() {
        return mascotaRepository.findAllByOrderByNombreMascotaAsc();
    }

    @Override
    public List<Mascota> listarMascotasOrdenado(boolean ascendente) {
        return ascendente ? mascotaRepository.findAllByOrderByNombreMascotaAsc()
                : mascotaRepository.findAllByOrderByNombreMascotaDesc();
    }

    @Override
    public List<Mascota> buscarPorNombre(String nombre) {
        if (Validar.vacio(nombre)) {
            throw new BadRequestException("El nombre a buscar es obligatorio.");
        }
        return mascotaRepository.findByNombreMascotaContainingIgnoreCaseOrderByNombreMascotaAsc(nombre.trim());
    }

    @Override
    public List<Mascota> buscarMascotasPorCliente(Long clienteId) {
        Validar.idValido(clienteId, "clienteId");
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("El cliente con ID " + clienteId + " no existe."));
        return mascotaRepository.findByClienteOrderByNombreMascotaAsc(cliente);
    }

    @Override
    public List<Mascota> buscarMascotasPorRaza(Integer razaId) {
        Validar.idValido(razaId, "razaId");
        Raza raza = razaRepository.findById(razaId)
                .orElseThrow(() -> new NotFoundException("La raza con ID " + razaId + " no existe."));
        return mascotaRepository.findByRazaOrderByNombreMascotaAsc(raza);
    }

    @Override
    public Mascota consultar(Integer mascotaId) {
        Validar.idValido(mascotaId, "mascotaId");
        return mascotaRepository.findById(mascotaId).orElseThrow(() -> new NotFoundException("La mascota no existe."));
    }

    @Override
    @Transactional
    public MiRespuestaRS guardarMascota(MascotaRq rq) {
        validar(rq);
        Cliente cliente = cliente(rq.getClienteId());
        if (mascotaRepository.existsByClienteAndNombreMascotaIgnoreCase(cliente, rq.getNombre().trim())) {
            throw new ConflictException("El cliente ya tiene una mascota registrada con ese nombre.");
        }
        Mascota m = new Mascota();
        mapear(m, rq, cliente);
        m.setActivo(Boolean.TRUE);
        m.setFechaRegistro(LocalDateTime.now());
        mascotaRepository.save(m);
        return MiRespuestaRS.creado("Mascota guardada correctamente.", m.getMascotaId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarMascota(MascotaRq rq) {
        validar(rq);
        Mascota m = consultar(rq.getMascotaId());
        Cliente cliente = cliente(rq.getClienteId());
        if (mascotaRepository.existsByClienteAndNombreMascotaIgnoreCaseAndMascotaIdNot(cliente, rq.getNombre().trim(),
                m.getMascotaId())) {
            throw new ConflictException("El cliente ya tiene otra mascota con ese nombre.");
        }
        mapear(m, rq, cliente);
        m.setFechaModificacion(LocalDateTime.now());
        mascotaRepository.save(m);
        return MiRespuestaRS.ok("Mascota actualizada correctamente.", m.getMascotaId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Integer mascotaId, boolean activo) {
        Mascota m = consultar(mascotaId);
        m.setActivo(activo);
        m.setFechaModificacion(LocalDateTime.now());
        mascotaRepository.save(m);
        return MiRespuestaRS.ok(activo ? "Mascota activada." : "Mascota inactivada.", mascotaId);
    }

    private Cliente cliente(Long clienteId) {
        Cliente c = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("El cliente con ID " + clienteId + " no existe."));
        if (!Boolean.TRUE.equals(c.getActivo())) {
            throw new ConflictException("El cliente está inactivo.");
        }
        return c;
    }

    private void mapear(Mascota m, MascotaRq rq, Cliente cliente) {
        Raza raza = razaRepository.findById(rq.getRazaId())
                .orElseThrow(() -> new NotFoundException("La raza con ID " + rq.getRazaId() + " no existe."));
        m.setNombreMascota(rq.getNombre().trim());
        m.setEdad(rq.getEdad());
        m.setSexo(Validar.limpiar(rq.getSexo()));
        m.setPesoKg(rq.getPesoKg());
        m.setCliente(cliente);
        m.setRaza(raza);
    }

    private void validar(MascotaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información de la mascota es obligatoria.");
        }
        Validar.texto(rq.getNombre(), "nombre", 100);
        Validar.idValido(rq.getClienteId(), "clienteId");
        Validar.idValido(rq.getRazaId(), "razaId");
        if (rq.getEdad() != null) {
            Validar.entero(rq.getEdad(), "edad", 0, 40);
        }
        if (rq.getSexo() != null && !rq.getSexo().isBlank() && !Set.of("M", "H").contains(rq.getSexo().trim())) {
            throw new BadRequestException("El sexo debe ser M (macho) o H (hembra).");
        }
        if (rq.getPesoKg() != null && (rq.getPesoKg().signum() <= 0 || rq.getPesoKg().compareTo(BigDecimal.valueOf(500)) > 0)) {
            throw new BadRequestException("El peso debe estar entre 0 y 500 kg.");
        }
    }
}
