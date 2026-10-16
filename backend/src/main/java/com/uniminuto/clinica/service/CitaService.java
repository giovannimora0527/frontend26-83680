package com.uniminuto.clinica.service;

import com.uniminuto.clinica.dto.CitaCoreDTO;
import com.uniminuto.clinica.dto.CitaDTO;
import com.uniminuto.clinica.dto.CitaRequest;
import com.uniminuto.clinica.exception.BusinessException;
import com.uniminuto.clinica.repository.CatalogoRepository;
import com.uniminuto.clinica.repository.CitaRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Implementa validaciones y reglas de agenda para citas médicas. */
@Service
public class CitaService {
    private static final Set<String> ESTADOS = Set.of("pendiente", "confirmada", "atendida", "cancelada", "programada");
    private final CitaRepository citas;
    private final CatalogoRepository catalogos;

    /** Construye el servicio de citas. */
    public CitaService(CitaRepository citas, CatalogoRepository catalogos) { this.citas=citas; this.catalogos=catalogos; }

    /** Lista citas ordenadas desde la más reciente y aplica el rango opcional. */
    public List<CitaDTO> listar(LocalDate desde, LocalDate hasta) {
        if ((desde == null) != (hasta == null)) throw new BusinessException(HttpStatus.BAD_REQUEST,"Debe indicar fechaInicial y fechaFinal al mismo tiempo.");
        if (desde != null && desde.isAfter(hasta)) throw new BusinessException(HttpStatus.BAD_REQUEST,"La fecha inicial no puede ser posterior a la fecha final.");
        return citas.listar(desde,hasta);
    }

    /** Consulta una cita o responde 404. */
    public CitaDTO obtener(Long id) { CitaDTO item=citas.obtener(id); if(item==null) throw new BusinessException(HttpStatus.NOT_FOUND,"No existe la cita solicitada."); return item; }

    /** Valida y registra una cita nueva. */
    @Transactional
    public CitaDTO crear(CitaRequest request) {
        validarRelaciones(request);
        if(request.fechaHora().isBefore(ahora())) throw new BusinessException(HttpStatus.BAD_REQUEST,"No se pueden registrar citas en fechas u horas anteriores a la actual.");
        String estado=normalizarEstado(request.estado());
        if("atendida".equals(estado) && request.fechaHora().isAfter(ahora())) throw new BusinessException(HttpStatus.BAD_REQUEST,"Una cita futura no puede registrarse como Atendida.");
        if(!"cancelada".equals(estado) && citas.existeCruce(request.medicoId(),request.mascotaId(),request.fechaHora(),null)) throw new BusinessException(HttpStatus.CONFLICT,"El veterinario o la mascota ya tienen una cita dentro del margen de 15 minutos.");
        CitaCoreDTO core=new CitaCoreDTO(null,request.clienteId(),request.mascotaId(),request.medicoId(),request.fechaHora(),estado);
        Long id=citas.insertar(core,estado,limpiar(request.motivo()));
        return obtener(id);
    }

    /** Actualiza una cita respetando las restricciones de estado y disponibilidad. */
    @Transactional
    public CitaDTO actualizar(Long id, CitaRequest request) {
        CitaCoreDTO actual=citas.obtenerCore(id);
        if(actual==null) throw new BusinessException(HttpStatus.NOT_FOUND,"No existe la cita que intenta modificar.");
        String estadoActual=normalizarEstado(actual.estado());
        if("cancelada".equals(estadoActual)) throw new BusinessException(HttpStatus.CONFLICT,"Una cita cancelada no se puede modificar como si siguiera activa.");
        if("atendida".equals(estadoActual)) throw new BusinessException(HttpStatus.CONFLICT,"Una cita atendida conserva su información histórica y no se puede editar.");
        validarRelaciones(request);
        String nuevoEstado=normalizarEstado(request.estado());
        if("atendida".equals(nuevoEstado) && request.fechaHora().isAfter(ahora())) throw new BusinessException(HttpStatus.BAD_REQUEST,"Una cita futura no puede cambiarse al estado Atendida.");
        if(request.fechaHora().isBefore(ahora()) && !request.fechaHora().equals(actual.fechaHora())) throw new BusinessException(HttpStatus.BAD_REQUEST,"No se puede mover una cita a una fecha pasada.");
        if(!"cancelada".equals(nuevoEstado) && citas.existeCruce(request.medicoId(),request.mascotaId(),request.fechaHora(),id)) throw new BusinessException(HttpStatus.CONFLICT,"El veterinario o la mascota ya tienen una cita dentro del margen de 15 minutos.");
        CitaCoreDTO nuevo=new CitaCoreDTO(id,request.clienteId(),request.mascotaId(),request.medicoId(),request.fechaHora(),nuevoEstado);
        citas.actualizar(id,nuevo,nuevoEstado,limpiar(request.motivo()));
        return obtener(id);
    }

    /** Valida cliente, pertenencia de mascota, veterinario y estado permitido. */
    private void validarRelaciones(CitaRequest request) {
        if(!catalogos.existeClienteActivo(request.clienteId())) throw new BusinessException(HttpStatus.BAD_REQUEST,"El cliente seleccionado no existe o está inactivo.");
        if(!catalogos.mascotaPerteneceCliente(request.mascotaId(),request.clienteId())) throw new BusinessException(HttpStatus.BAD_REQUEST,"La mascota no pertenece al cliente seleccionado.");
        if(!catalogos.existeMedico(request.medicoId())) throw new BusinessException(HttpStatus.BAD_REQUEST,"El veterinario seleccionado no existe.");
        normalizarEstado(request.estado());
    }

    /** Convierte el estado a minúsculas y verifica el catálogo del parcial. */
    private String normalizarEstado(String valor) {
        String estado=valor==null?"":valor.trim().toLowerCase(Locale.ROOT);
        if(!ESTADOS.contains(estado)) throw new BusinessException(HttpStatus.BAD_REQUEST,"Estado inválido. Use Pendiente, Confirmada, Atendida, Cancelada o Programada.");
        return estado;
    }
    private String limpiar(String texto) { return texto==null||texto.isBlank()?null:texto.trim(); }
    private LocalDateTime ahora() { return LocalDateTime.now(ZoneId.of("America/Bogota")); }
}
