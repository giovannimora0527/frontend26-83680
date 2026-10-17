package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Especializacion;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.MedicoRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.EspecializacionRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.MedicoService;
import com.uniminuto.clinica.util.Validaciones;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Implementación de las reglas de negocio de los veterinarios: datos
 * obligatorios válidos, especialización existente, y documento y registro
 * profesional únicos.
 */
@Service
public class MedicoServiceImpl implements MedicoService {

    /**
     * Tipos de documento aceptados para un veterinario.
     */
    private static final List<String> TIPOS_DOCUMENTO = List.of("CC", "CE", "PA");

    /**
     * Número de documento: 5 a 20 letras o números.
     */
    private static final Pattern DOCUMENTO = Pattern.compile("^[A-Z0-9]{5,20}$");

    /**
     * Registro profesional: 3 a 50 letras, números o guiones.
     */
    private static final Pattern REGISTRO = Pattern.compile("^[A-Z0-9-]{3,50}$");

    /**
     * Teléfono: 7 a 20 dígitos, espacios y "+" inicial.
     */
    private static final Pattern TELEFONO = Pattern.compile("^\\+?[0-9 ]{7,20}$");

    /**
     * Identificador que no existe, para reutilizar las consultas "IdNot" al crear.
     */
    private static final Long SIN_ID = -1L;

    /**
     * Repositorio de veterinarios.
     */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * Repositorio de especializaciones.
     */
    @Autowired
    private EspecializacionRepository especializacionRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Medico> listarMedicos() {
        return medicoRepository.findAll(Sort.by("nombres").and(Sort.by("apellidos")));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Medico consultarMedico(Long id) {
        return medicoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("El veterinario no existe"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarMedico(MedicoRq rq) {
        Medico medico = new Medico();
        this.aplicarDatos(medico, rq, SIN_ID);
        medicoRepository.save(medico);
        return MiRespuestaRS.de(201, "Veterinario registrado correctamente");
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarMedico(Long id, MedicoRq rq) {
        Medico medico = this.consultarMedico(id);
        this.aplicarDatos(medico, rq, id);
        medicoRepository.save(medico);
        return MiRespuestaRS.de(200, "Veterinario actualizado correctamente");
    }

    /**
     * Valida los datos (incluida la unicidad, antes de modificar la entidad
     * para que Hibernate no la guarde antes de tiempo) y los copia al veterinario.
     *
     * @param medico veterinario a completar.
     * @param rq     datos recibidos.
     * @param id     veterinario que se edita (SIN_ID al crear).
     */
    private void aplicarDatos(Medico medico, MedicoRq rq, Long id) {
        if (rq == null) {
            throw new BadRequestException("Debe enviar los datos del veterinario");
        }
        String tipo = Validaciones.obligatorio(rq.getTipoDocumento(), "El tipo de documento", 10).toUpperCase();
        if (!TIPOS_DOCUMENTO.contains(tipo)) {
            throw new BadRequestException("El tipo de documento no es válido. Use: " + String.join(", ", TIPOS_DOCUMENTO));
        }
        String numero = Validaciones.conPatron(
                rq.getNumeroDocumento() == null ? null : rq.getNumeroDocumento().trim().toUpperCase(),
                "El número de documento", 20, DOCUMENTO,
                "El número de documento debe tener entre 5 y 20 letras o números, sin espacios ni puntos");
        String nombres = Validaciones.conPatron(rq.getNombres(), "El nombre", 100,
                Validaciones.SOLO_LETRAS, "El nombre solo puede contener letras");
        String apellidos = Validaciones.conPatron(rq.getApellidos(), "El apellido", 100,
                Validaciones.SOLO_LETRAS, "El apellido solo puede contener letras");
        String telefono = Validaciones.opcional(rq.getTelefono(), "El teléfono", 20);
        if (telefono != null && !TELEFONO.matcher(telefono).matches()) {
            throw new BadRequestException("El teléfono debe tener entre 7 y 20 dígitos");
        }
        String registro = Validaciones.conPatron(
                rq.getRegistroProfesional() == null ? null : rq.getRegistroProfesional().trim().toUpperCase(),
                "El registro profesional", 50, REGISTRO,
                "El registro profesional debe tener de 3 a 50 letras, números o guiones");
        if (rq.getEspecializacionId() == null) {
            throw new BadRequestException("Debe seleccionar la especialización");
        }
        Especializacion especializacion = especializacionRepository.findById(rq.getEspecializacionId())
                .orElseThrow(() -> new NotFoundException("La especialización seleccionada no existe"));

        if (medicoRepository.existsByTipoDocumentoAndNumeroDocumentoAndIdNot(tipo, numero, id)) {
            throw new ConflictException("Ya existe un veterinario con el documento " + tipo + " " + numero);
        }
        if (medicoRepository.existsByRegistroProfesionalIgnoreCaseAndIdNot(registro, id)) {
            throw new ConflictException("Ya existe un veterinario con el registro profesional " + registro);
        }

        medico.setTipoDocumento(tipo);
        medico.setNumeroDocumento(numero);
        medico.setNombres(nombres);
        medico.setApellidos(apellidos);
        medico.setTelefono(telefono);
        medico.setRegistroProfesional(registro);
        medico.setEspecializacion(especializacion);
    }
}
