package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import com.uniminuto.clinica.repository.RazaRepository;
import com.uniminuto.clinica.service.RazaService;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RazaServiceImpl implements RazaService {

    @Autowired
    private RazaRepository razaRepository;

    @Override
    public List<Raza> listarRazas() {
        return razaRepository.findAllByOrderByEspecieAscNombreAsc();
    }

    @Override
    @Transactional
    public MiRespuestaRS guardarRaza(RazaRq rq) {
        validar(rq);
        if (razaRepository.existsByNombreIgnoreCaseAndEspecieIgnoreCase(rq.getNombre().trim(), rq.getEspecie().trim())) {
            throw new ConflictException("La raza ya existe para la especie indicada.");
        }
        Raza r = new Raza();
        r.setNombre(rq.getNombre().trim());
        r.setEspecie(rq.getEspecie().trim());
        r.setFechaCreacion(LocalDateTime.now());
        razaRepository.save(r);
        return MiRespuestaRS.creado("Raza guardada correctamente.", r.getRazaId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarRaza(RazaRq rq) {
        validar(rq);
        Validar.idValido(rq.getRazaId(), "razaId");
        Raza r = razaRepository.findById(rq.getRazaId()).orElseThrow(() -> new NotFoundException("La raza no existe."));
        if (razaRepository.existsByNombreIgnoreCaseAndEspecieIgnoreCaseAndRazaIdNot(rq.getNombre().trim(),
                rq.getEspecie().trim(), r.getRazaId())) {
            throw new ConflictException("Ya existe otra raza con ese nombre para la especie.");
        }
        r.setNombre(rq.getNombre().trim());
        r.setEspecie(rq.getEspecie().trim());
        r.setFechaModificacion(LocalDateTime.now());
        razaRepository.save(r);
        return MiRespuestaRS.ok("Raza actualizada correctamente.", r.getRazaId());
    }

    private void validar(RazaRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información de la raza es obligatoria.");
        }
        Validar.texto(rq.getNombre(), "nombre", 100);
        Validar.texto(rq.getEspecie(), "especie", 100);
    }
}
