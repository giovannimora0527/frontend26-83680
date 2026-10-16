package com.uniminuto.clinica.service;

import com.uniminuto.clinica.dto.CitaCoreDTO;
import com.uniminuto.clinica.dto.HistoriaClinicaDTO;
import com.uniminuto.clinica.dto.HistoriaClinicaRequest;
import com.uniminuto.clinica.exception.BusinessException;
import com.uniminuto.clinica.repository.CatalogoRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestiona el registro y consulta de historias clínicas. */
@Service
public class HistoriaClinicaService {
    private final HistoriaClinicaRepository historias;
    private final CitaRepository citas;
    private final CatalogoRepository catalogos;
    /** Construye el servicio de historias. */
    public HistoriaClinicaService(HistoriaClinicaRepository historias,CitaRepository citas,CatalogoRepository catalogos){this.historias=historias;this.citas=citas;this.catalogos=catalogos;}
    /** Lista historias con un rango de fechas opcional. */
    public List<HistoriaClinicaDTO> listar(LocalDate desde,LocalDate hasta){if((desde==null)!=(hasta==null))throw new BusinessException(HttpStatus.BAD_REQUEST,"Debe indicar fechaInicial y fechaFinal al mismo tiempo.");if(desde!=null&&desde.isAfter(hasta))throw new BusinessException(HttpStatus.BAD_REQUEST,"La fecha inicial no puede ser posterior a la fecha final.");return historias.listar(desde,hasta);}
    /** Obtiene una historia o responde 404. */
    public HistoriaClinicaDTO obtener(Long id){HistoriaClinicaDTO item=historias.obtener(id);if(item==null)throw new BusinessException(HttpStatus.NOT_FOUND,"No existe la historia clínica solicitada.");return item;}
    /** Crea una historia clínica únicamente a partir de una cita atendida y relacionada correctamente. */
    @Transactional
    public HistoriaClinicaDTO crear(HistoriaClinicaRequest request){
        if(!catalogos.existeClienteActivo(request.clienteId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"El cliente seleccionado no existe o está inactivo.");
        if(!catalogos.mascotaPerteneceCliente(request.mascotaId(),request.clienteId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"La mascota no pertenece al cliente seleccionado.");
        if(!catalogos.existeMedico(request.medicoId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"El veterinario seleccionado no existe.");
        CitaCoreDTO cita=citas.obtenerCore(request.citaId());
        if(cita==null)throw new BusinessException(HttpStatus.BAD_REQUEST,"La cita asociada no existe.");
        if(!cita.clienteId().equals(request.clienteId())||!cita.mascotaId().equals(request.mascotaId())||!cita.medicoId().equals(request.medicoId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"La cita, el cliente, la mascota y el veterinario deben corresponder al mismo registro.");
        if(!"atendida".equalsIgnoreCase(cita.estado()))throw new BusinessException(HttpStatus.CONFLICT,"La historia clínica solo se puede generar desde una cita marcada como Atendida.");
        if(historias.existePorCita(request.citaId()))throw new BusinessException(HttpStatus.CONFLICT,"La cita ya tiene una historia clínica asociada.");
        Long id=historias.insertar(request.mascotaId(),request.citaId(),request.medicoId(),request.motivoConsulta().trim(),request.diagnostico().trim(),limpiar(request.observaciones()));return obtener(id);
    }
    private String limpiar(String text){return text==null||text.isBlank()?null:text.trim();}
}
