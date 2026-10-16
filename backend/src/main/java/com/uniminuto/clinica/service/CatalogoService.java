package com.uniminuto.clinica.service;

import com.uniminuto.clinica.dto.ClienteDTO;
import com.uniminuto.clinica.dto.MascotaDTO;
import com.uniminuto.clinica.dto.MedicoDTO;
import com.uniminuto.clinica.dto.MedicamentoDTO;
import com.uniminuto.clinica.exception.BusinessException;
import com.uniminuto.clinica.repository.CatalogoRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Reglas de consulta para catálogos de clientes, mascotas, médicos y medicamentos. */
@Service
public class CatalogoService {
    private final CatalogoRepository repository;
    /** Construye el servicio de catálogos. */
    public CatalogoService(CatalogoRepository repository) { this.repository=repository; }
    /** Lista clientes activos. */
    public List<ClienteDTO> clientes() { return repository.listarClientes(); }
    /** Obtiene un cliente o lanza 404 si no existe. */
    public ClienteDTO cliente(Long id) { ClienteDTO item=repository.obtenerCliente(id); if(item==null) throw new BusinessException(HttpStatus.NOT_FOUND,"No existe el cliente solicitado."); return item; }
    /** Lista mascotas, filtradas por cliente cuando se envía su ID. */
    public List<MascotaDTO> mascotas(Long clienteId) { if(clienteId!=null && !repository.existeClienteActivo(clienteId)) throw new BusinessException(HttpStatus.NOT_FOUND,"No existe el cliente seleccionado."); return repository.listarMascotas(clienteId); }
    /** Obtiene una mascota o lanza 404 si no existe. */
    public MascotaDTO mascota(Long id) { MascotaDTO item=repository.obtenerMascota(id); if(item==null) throw new BusinessException(HttpStatus.NOT_FOUND,"No existe la mascota solicitada."); return item; }
    /** Lista veterinarios. */
    public List<MedicoDTO> medicos() { return repository.listarMedicos(); }
    /** Lista medicamentos. */
    public List<MedicamentoDTO> medicamentos() { return repository.listarMedicamentos(); }
}
