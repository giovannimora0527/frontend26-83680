package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.service.ClienteService;
import com.uniminuto.clinica.utils.Validar;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class ClienteServiceImpl implements ClienteService {

    private static final Set<String> TIPOS_DOCUMENTO = Set.of("CC", "CE", "PA", "PPT", "NIT");

    @Autowired
    private ClienteRepository clienteRepository;

    @Override
    public List<Cliente> listarClientes() {
        return clienteRepository.findAllByOrderByApellidosAscNombresAsc();
    }

    @Override
    public Cliente consultar(Long clienteId) {
        Validar.idValido(clienteId, "clienteId");
        return clienteRepository.findById(clienteId)
                .orElseThrow(() -> new NotFoundException("El cliente no existe."));
    }

    @Override
    public Cliente buscarClientesPorDocumento(String documento) {
        if (Validar.vacio(documento)) {
            throw new BadRequestException("El número de documento es obligatorio.");
        }
        return clienteRepository.findByNumeroDocumento(documento.trim())
                .orElseThrow(() -> new NotFoundException("No existe un cliente con el documento " + documento.trim() + "."));
    }

    @Override
    @Transactional
    public MiRespuestaRS guardar(ClienteRq rq) {
        validar(rq);
        if (clienteRepository.existsByNumeroDocumento(rq.getNumeroDocumento().trim())) {
            throw new ConflictException("Ya existe un cliente con el documento " + rq.getNumeroDocumento().trim() + ".");
        }
        Cliente c = new Cliente();
        mapear(c, rq);
        c.setActivo(Boolean.TRUE);
        clienteRepository.save(c);
        return MiRespuestaRS.creado("Cliente registrado correctamente.", c.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizar(ClienteRq rq) {
        validar(rq);
        Cliente c = consultar(rq.getId());
        if (clienteRepository.existsByNumeroDocumentoAndIdNot(rq.getNumeroDocumento().trim(), c.getId())) {
            throw new ConflictException("Ya existe otro cliente con el documento " + rq.getNumeroDocumento().trim() + ".");
        }
        mapear(c, rq);
        clienteRepository.save(c);
        return MiRespuestaRS.ok("Cliente actualizado correctamente.", c.getId());
    }

    @Override
    @Transactional
    public MiRespuestaRS cambiarEstado(Long clienteId, boolean activo) {
        Cliente c = consultar(clienteId);
        c.setActivo(activo);
        clienteRepository.save(c);
        return MiRespuestaRS.ok(activo ? "Cliente activado." : "Cliente inactivado.", clienteId);
    }

    private void validar(ClienteRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del cliente es obligatoria.");
        }
        Validar.enLista(rq.getTipoDocumento(), TIPOS_DOCUMENTO, "tipo de documento");
        String doc = Validar.texto(rq.getNumeroDocumento(), "número de documento", 20);
        if (!doc.matches("^[A-Za-z0-9-]{5,20}$")) {
            throw new BadRequestException("El número de documento debe tener entre 5 y 20 caracteres alfanuméricos.");
        }
        Validar.texto(rq.getNombres(), "nombres", 100);
        Validar.texto(rq.getApellidos(), "apellidos", 100);
        Validar.obligatorio(rq.getFechaNacimiento(), "fecha de nacimiento");
        if (rq.getFechaNacimiento().isAfter(LocalDate.now().minusYears(18))) {
            throw new BadRequestException("El propietario debe ser mayor de edad.");
        }
        if (rq.getGenero() != null && !rq.getGenero().isBlank() && !Set.of("M", "F", "O").contains(rq.getGenero().trim())) {
            throw new BadRequestException("El género debe ser M, F u O.");
        }
        String tel = Validar.textoOpcional(rq.getTelefono(), "teléfono", 20);
        if (tel != null && !tel.matches("^[0-9+ ()-]{7,20}$")) {
            throw new BadRequestException("El teléfono no es válido.");
        }
        String email = Validar.textoOpcional(rq.getEmail(), "email", 150);
        if (email != null && !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new BadRequestException("El correo electrónico no es válido.");
        }
    }

    private void mapear(Cliente c, ClienteRq rq) {
        c.setTipoDocumento(rq.getTipoDocumento().trim().toUpperCase());
        c.setNumeroDocumento(rq.getNumeroDocumento().trim());
        c.setNombres(rq.getNombres().trim());
        c.setApellidos(rq.getApellidos().trim());
        c.setFechaNacimiento(rq.getFechaNacimiento());
        c.setGenero(Validar.limpiar(rq.getGenero()));
        c.setTelefono(Validar.limpiar(rq.getTelefono()));
        c.setEmail(Validar.limpiar(rq.getEmail()));
        c.setDireccion(Validar.limpiar(rq.getDireccion()));
    }
}
