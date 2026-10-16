package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.dto.ClienteDTO;
import com.uniminuto.clinica.dto.MascotaDTO;
import com.uniminuto.clinica.dto.MedicoDTO;
import com.uniminuto.clinica.dto.MedicamentoDTO;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** Consultas de lectura para las entidades maestras necesarias en los formularios. */
@Repository
public class CatalogoRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<ClienteDTO> clienteMapper = (rs, row) -> new ClienteDTO(
        rs.getLong("cliente_id"), rs.getString("nombres"), rs.getString("apellidos"),
        (rs.getString("nombres") + " " + rs.getString("apellidos")).trim(),
        rs.getString("tipo_documento"), rs.getString("numero_documento"), rs.getString("telefono"), rs.getBoolean("activo"));
    private final RowMapper<MascotaDTO> mascotaMapper = (rs, row) -> new MascotaDTO(
        rs.getLong("mascota_id"), rs.getString("nombre_mascota"), rs.getInt("edad"),
        rs.getLong("cliente_id"), rs.getString("cliente_nombre"), rs.getString("especie"));
    private final RowMapper<MedicoDTO> medicoMapper = (rs, row) -> new MedicoDTO(
        rs.getLong("id"), rs.getString("nombres"), rs.getString("apellidos"),
        (rs.getString("nombres") + " " + rs.getString("apellidos")).trim(), rs.getString("registro_profesional"));
    private final RowMapper<MedicamentoDTO> medicamentoMapper = (rs, row) -> new MedicamentoDTO(
        rs.getLong("id"), rs.getString("nombre"), rs.getString("descripcion"),
        rs.getString("presentacion"), rs.getDate("fecha_vence") == null ? null : rs.getDate("fecha_vence").toLocalDate());

    /** Inyecta el acceso SQL. */
    public CatalogoRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Lista clientes activos por apellido y nombre. */
    public List<ClienteDTO> listarClientes() {
        return jdbc.query("SELECT cliente_id,nombres,apellidos,tipo_documento,numero_documento,telefono,activo FROM cliente WHERE activo=1 ORDER BY apellidos,nombres", clienteMapper);
    }

    /** Consulta un cliente por su identificador. */
    public ClienteDTO obtenerCliente(Long id) {
        return jdbc.query("SELECT cliente_id,nombres,apellidos,tipo_documento,numero_documento,telefono,activo FROM cliente WHERE cliente_id=?", clienteMapper, id).stream().findFirst().orElse(null);
    }

    /** Lista mascotas; si recibe un cliente, limita el resultado a sus mascotas. */
    public List<MascotaDTO> listarMascotas(Long clienteId) {
        String sql = "SELECT p.mascota_id,p.nombre_mascota,p.edad,p.cliente_id,CONCAT(cl.nombres,' ',cl.apellidos) AS cliente_nombre,r.especie FROM mascota p LEFT JOIN cliente cl ON cl.cliente_id=p.cliente_id LEFT JOIN raza r ON r.raza_id=p.raza_id";
        if (clienteId != null) return jdbc.query(sql + " WHERE p.cliente_id=? ORDER BY p.nombre_mascota", mascotaMapper, clienteId);
        return jdbc.query(sql + " ORDER BY p.nombre_mascota", mascotaMapper);
    }

    /** Consulta una mascota. */
    public MascotaDTO obtenerMascota(Long id) {
        return jdbc.query("SELECT p.mascota_id,p.nombre_mascota,p.edad,p.cliente_id,CONCAT(cl.nombres,' ',cl.apellidos) AS cliente_nombre,r.especie FROM mascota p LEFT JOIN cliente cl ON cl.cliente_id=p.cliente_id LEFT JOIN raza r ON r.raza_id=p.raza_id WHERE p.mascota_id=?", mascotaMapper, id).stream().findFirst().orElse(null);
    }

    /** Lista veterinarios disponibles para asignación. */
    public List<MedicoDTO> listarMedicos() {
        return jdbc.query("SELECT id,nombres,apellidos,registro_profesional FROM medico ORDER BY apellidos,nombres", medicoMapper);
    }

    /** Consulta un veterinario por su identificador. */
    public MedicoDTO obtenerMedico(Long id) {
        return jdbc.query("SELECT id,nombres,apellidos,registro_profesional FROM medico WHERE id=?", medicoMapper, id).stream().findFirst().orElse(null);
    }

    /** Lista medicamentos que pueden seleccionarse al crear una fórmula. */
    public List<MedicamentoDTO> listarMedicamentos() {
        return jdbc.query("SELECT id,nombre,descripcion,presentacion,fecha_vence FROM medicamento ORDER BY nombre", medicamentoMapper);
    }

    /** Consulta un medicamento por su identificador. */
    public MedicamentoDTO obtenerMedicamento(Long id) {
        return jdbc.query("SELECT id,nombre,descripcion,presentacion,fecha_vence FROM medicamento WHERE id=?", medicamentoMapper, id).stream().findFirst().orElse(null);
    }

    /** Indica si un cliente existe y está activo. */
    public boolean existeClienteActivo(Long id) { return jdbc.queryForObject("SELECT COUNT(*) FROM cliente WHERE cliente_id=? AND activo=1", Integer.class, id) > 0; }
    /** Comprueba que la mascota exista y pertenezca al cliente indicado. */
    public boolean mascotaPerteneceCliente(Long mascotaId, Long clienteId) { return jdbc.queryForObject("SELECT COUNT(*) FROM mascota WHERE mascota_id=? AND cliente_id=?", Integer.class, mascotaId, clienteId) > 0; }
    /** Indica si el veterinario existe. */
    public boolean existeMedico(Long id) { return jdbc.queryForObject("SELECT COUNT(*) FROM medico WHERE id=?", Integer.class, id) > 0; }
    /** Indica si el medicamento existe. */
    public boolean existeMedicamento(Long id) { return jdbc.queryForObject("SELECT COUNT(*) FROM medicamento WHERE id=?", Integer.class, id) > 0; }
}
