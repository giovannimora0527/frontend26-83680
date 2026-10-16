package com.uniminuto.clinica.controller;

import com.uniminuto.clinica.dto.ClienteDTO;
import com.uniminuto.clinica.dto.MascotaDTO;
import com.uniminuto.clinica.dto.MedicoDTO;
import com.uniminuto.clinica.dto.MedicamentoDTO;
import com.uniminuto.clinica.service.CatalogoService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints de lectura de los catálogos necesarios para los formularios. */
@RestController
public class CatalogoController {
    private final CatalogoService service;
    /** Construye el controlador de catálogos. */
    public CatalogoController(CatalogoService service){this.service=service;}
    /** Lista los clientes activos. */
    @GetMapping("/clientes") public List<ClienteDTO> clientes(){return service.clientes();}
    /** Consulta un cliente por ID. */
    @GetMapping("/clientes/{id}") public ClienteDTO cliente(@PathVariable Long id){return service.cliente(id);}
    /** Lista mascotas y permite filtrarlas por clienteId. */
    @GetMapping("/mascotas") public List<MascotaDTO> mascotas(@RequestParam(required=false) Long clienteId){return service.mascotas(clienteId);}
    /** Consulta una mascota por ID. */
    @GetMapping("/mascotas/{id}") public MascotaDTO mascota(@PathVariable Long id){return service.mascota(id);}
    /** Lista veterinarios. */
    @GetMapping("/medicos") public List<MedicoDTO> medicos(){return service.medicos();}
    /** Lista medicamentos. */
    @GetMapping("/medicamentos") public List<MedicamentoDTO> medicamentos(){return service.medicamentos();}
}
