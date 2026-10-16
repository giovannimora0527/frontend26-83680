package com.uniminuto.clinica.service;

import com.uniminuto.clinica.dto.AnotacionHistoriaDTO;
import com.uniminuto.clinica.dto.AnotacionHistoriaRequest;
import com.uniminuto.clinica.dto.HistoriaClinicaDTO;
import com.uniminuto.clinica.exception.BusinessException;
import com.uniminuto.clinica.repository.CatalogoRepository;
import com.uniminuto.clinica.repository.HistoriaClinicaRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestiona las anotaciones que componen el histórico clínico de cada mascota. */
@Service
public class AnotacionHistoriaService {
    private final HistoriaClinicaRepository historias;
    private final CatalogoRepository catalogos;
    /** Construye el servicio de anotaciones. */
    public AnotacionHistoriaService(HistoriaClinicaRepository historias,CatalogoRepository catalogos){this.historias=historias;this.catalogos=catalogos;}
    /** Lista todas las anotaciones con filtro opcional de fecha. */
    public List<AnotacionHistoriaDTO> listar(LocalDate desde,LocalDate hasta){if((desde==null)!=(hasta==null))throw new BusinessException(HttpStatus.BAD_REQUEST,"Debe indicar fechaInicial y fechaFinal al mismo tiempo.");if(desde!=null&&desde.isAfter(hasta))throw new BusinessException(HttpStatus.BAD_REQUEST,"La fecha inicial no puede ser posterior a la fecha final.");return historias.listarTodasAnotaciones(desde,hasta);}
    /** Lista el histórico de una historia, desde la anotación más reciente. */
    public List<AnotacionHistoriaDTO> listarPorHistoria(Long historiaId){historias.obtener(historiaId);return historias.listarAnotaciones(historiaId);}
    /** Crea una anotación después de validar historia, veterinario y fecha. */
    @Transactional
    public AnotacionHistoriaDTO crear(AnotacionHistoriaRequest request){validar(request);Long id=historias.insertarAnotacion(request.historiaId(),request.medicoId(),request.fecha(),request.descripcion().trim(),limpiar(request.observacion()),limpiar(request.diagnostico()));return obtener(id);}
    /** Actualiza una anotación y conserva el resto del histórico. */
    @Transactional
    public AnotacionHistoriaDTO actualizar(Long id,AnotacionHistoriaRequest request){obtener(id);validar(request);historias.actualizarAnotacion(id,request.historiaId(),request.medicoId(),request.fecha(),request.descripcion().trim(),limpiar(request.observacion()),limpiar(request.diagnostico()));return obtener(id);}
    /** Obtiene una anotación individual o responde 404. */
    public AnotacionHistoriaDTO obtener(Long id){AnotacionHistoriaDTO item=historias.obtenerAnotacion(id);if(item==null)throw new BusinessException(HttpStatus.NOT_FOUND,"No existe la anotación solicitada.");return item;}
    private void validar(AnotacionHistoriaRequest request){
        HistoriaClinicaDTO historia=historias.obtener(request.historiaId());if(historia==null)throw new BusinessException(HttpStatus.BAD_REQUEST,"La historia clínica asociada no existe.");
        if(!catalogos.existeMedico(request.medicoId()))throw new BusinessException(HttpStatus.BAD_REQUEST,"El veterinario seleccionado no existe.");
        if(historia.fechaHora()!=null&&request.fecha().isBefore(historia.fechaHora()))throw new BusinessException(HttpStatus.BAD_REQUEST,"La anotación no puede tener fecha anterior a la consulta clínica.");
    }
    private String limpiar(String text){return text==null||text.isBlank()?null:text.trim();}
}
