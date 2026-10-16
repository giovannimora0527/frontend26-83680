package com.uniminuto.clinica.service;

import com.uniminuto.clinica.dto.CitaCoreDTO;
import com.uniminuto.clinica.dto.FormulaMedicaDTO;
import com.uniminuto.clinica.dto.FormulaMedicaRequest;
import com.uniminuto.clinica.exception.BusinessException;
import com.uniminuto.clinica.repository.CatalogoRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implementa reglas de creación, edición y consulta de fórmulas médicas. */
@Service
public class FormulaMedicaService {
    private final FormulaMedicaRepository formulas;
    private final CitaRepository citas;
    private final CatalogoRepository catalogos;
    /** Construye el servicio de fórmulas. */
    public FormulaMedicaService(FormulaMedicaRepository formulas,CitaRepository citas,CatalogoRepository catalogos){this.formulas=formulas;this.citas=citas;this.catalogos=catalogos;}
    /** Lista fórmulas activas desde la emisión más reciente. */
    public List<FormulaMedicaDTO> listar(){return formulas.listar();}
    /** Obtiene una fórmula activa o responde 404. */
    public FormulaMedicaDTO obtener(Long id){FormulaMedicaDTO item=formulas.obtener(id);if(item==null)throw new BusinessException(HttpStatus.NOT_FOUND,"No existe la fórmula médica solicitada.");return item;}
    /** Valida las relaciones y crea una fórmula médica. */
    @Transactional
    public FormulaMedicaDTO crear(FormulaMedicaRequest request){validar(request);Long id=formulas.insertar(request.citaId(),request.medicamentoId(),request.dosis().trim(),request.frecuencia().trim(),request.duracionTratamiento().trim(),limpiar(request.indicaciones()),request.fechaEmision());return obtener(id);}
    /** Valida relaciones y actualiza una fórmula existente. */
    @Transactional
    public FormulaMedicaDTO actualizar(Long id,FormulaMedicaRequest request){obtener(id);validar(request);formulas.actualizar(id,request.citaId(),request.medicamentoId(),request.dosis().trim(),request.frecuencia().trim(),request.duracionTratamiento().trim(),limpiar(request.indicaciones()),request.fechaEmision());return obtener(id);}
    /** Inactiva una fórmula para conservar el historial clínico en lugar de borrarla físicamente. */
    @Transactional
    public void inactivar(Long id){obtener(id);formulas.inactivar(id);}
    /** Valida cita, mascota/cliente/veterinario derivados de la cita, medicamento y fecha de emisión. */
    private void validar(FormulaMedicaRequest request){
        CitaCoreDTO cita=citas.obtenerCore(request.citaId());
        if(cita==null)throw new BusinessException(HttpStatus.BAD_REQUEST,"La cita asociada no existe.");
        if(!catalogos.existeClienteActivo(cita.clienteId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"El cliente de la cita no existe o está inactivo.");
        if(!catalogos.mascotaPerteneceCliente(cita.mascotaId(),cita.clienteId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"La mascota de la cita no pertenece al cliente registrado.");
        if(!catalogos.existeMedico(cita.medicoId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"El veterinario asociado a la cita no existe.");
        if(!catalogos.existeMedicamento(request.medicamentoId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"El medicamento seleccionado no existe.");
        if(request.fechaEmision().isBefore(cita.fechaHora()))throw new BusinessException(HttpStatus.BAD_REQUEST,"La fecha de emisión de la fórmula no puede ser anterior a la fecha de la consulta.");
        if(request.dosis().trim().length()<2)throw new BusinessException(HttpStatus.BAD_REQUEST,"La dosis debe contener al menos dos caracteres.");
        if(request.frecuencia().trim().length()<2)throw new BusinessException(HttpStatus.BAD_REQUEST,"Indique una frecuencia válida.");
        if(request.duracionTratamiento().trim().length()<1)throw new BusinessException(HttpStatus.BAD_REQUEST,"Indique la duración del tratamiento.");
    }
    private String limpiar(String texto){return texto==null||texto.isBlank()?null:texto.trim();}
}
