package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.dto.FormulaMedicaDTO;
import java.sql.Timestamp;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

/** Persistencia de fórmulas médicas con consultas de datos asociados. */
@Repository
public class FormulaMedicaRepository {
    private final JdbcTemplate jdbc;
    private final RowMapper<FormulaMedicaDTO> mapper = (rs, row) -> new FormulaMedicaDTO(
        rs.getLong("id"), rs.getLong("cita_id"), rs.getLong("mascota_id"), rs.getLong("cliente_id"),
        rs.getString("cliente_nombre"), rs.getString("mascota_nombre"), rs.getLong("medico_id"),
        rs.getString("medico_nombre"), rs.getLong("medicamento_id"), rs.getString("medicamento_nombre"),
        rs.getString("dosis"), rs.getString("frecuencia"), rs.getString("duracion_tratamiento"),
        rs.getString("indicaciones"), rs.getTimestamp("fecha_emision") == null ? null : rs.getTimestamp("fecha_emision").toLocalDateTime(),
        rs.getTimestamp("fecha_creacion_registro").toLocalDateTime(),
        rs.getTimestamp("fecha_actualizacion_registro") == null ? null : rs.getTimestamp("fecha_actualizacion_registro").toLocalDateTime(),
        rs.getBoolean("activo"), rs.getTimestamp("fecha_cita") == null ? null : rs.getTimestamp("fecha_cita").toLocalDateTime());
    private static final String SELECT = "SELECT f.id,f.cita_id,c.mascota_id,c.cliente_id,CONCAT(cl.nombres,' ',cl.apellidos) AS cliente_nombre,p.nombre_mascota AS mascota_nombre,c.medico_id,CONCAT(md.nombres,' ',md.apellidos) AS medico_nombre,f.medicamento_id,med.nombre AS medicamento_nombre,f.dosis,f.frecuencia,f.duracion_tratamiento,f.indicaciones,f.fecha_emision,f.fecha_creacion_registro,f.fecha_actualizacion_registro,f.activo,c.fecha_hora AS fecha_cita FROM formula_medica f LEFT JOIN cita c ON c.id=f.cita_id LEFT JOIN mascota p ON p.mascota_id=c.mascota_id LEFT JOIN cliente cl ON cl.cliente_id=c.cliente_id LEFT JOIN medico md ON md.id=c.medico_id LEFT JOIN medicamento med ON med.id=f.medicamento_id";

    /** Inyecta el acceso SQL. */
    public FormulaMedicaRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    /** Lista fórmulas activas desde la fecha de emisión más reciente. */
    public List<FormulaMedicaDTO> listar() { return jdbc.query(SELECT + " WHERE f.activo=1 ORDER BY COALESCE(f.fecha_emision,f.fecha_creacion_registro) DESC,f.id DESC", mapper); }

    /** Consulta una fórmula activa por identificador. */
    public FormulaMedicaDTO obtener(Long id) { return jdbc.query(SELECT + " WHERE f.id=? AND f.activo=1", mapper, id).stream().findFirst().orElse(null); }

    /** Guarda una fórmula nueva y devuelve su identificador. */
    public Long insertar(Long citaId, Long medicamentoId, String dosis, String frecuencia, String duracion,
            String indicaciones, java.time.LocalDateTime fechaEmision) {
        KeyHolder key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement("INSERT INTO formula_medica(cita_id,medicamento_id,dosis,indicaciones,fecha_creacion_registro,fecha_actualizacion_registro,frecuencia,duracion_tratamiento,fecha_emision,activo) VALUES(?,?,?,?,CURRENT_TIMESTAMP,NULL,?,?,?,1)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1,citaId); ps.setLong(2,medicamentoId); ps.setString(3,dosis); ps.setString(4,indicaciones);
            ps.setString(5,frecuencia); ps.setString(6,duracion); ps.setTimestamp(7,Timestamp.valueOf(fechaEmision)); return ps;
        }, key);
        return key.getKey().longValue();
    }

    /** Actualiza una fórmula activa sin eliminar físicamente su historial. */
    public void actualizar(Long id, Long citaId, Long medicamentoId, String dosis, String frecuencia,
            String duracion, String indicaciones, java.time.LocalDateTime fechaEmision) {
        jdbc.update("UPDATE formula_medica SET cita_id=?,medicamento_id=?,dosis=?,indicaciones=?,frecuencia=?,duracion_tratamiento=?,fecha_emision=?,fecha_actualizacion_registro=CURRENT_TIMESTAMP WHERE id=? AND activo=1",
            citaId, medicamentoId, dosis, indicaciones, frecuencia, duracion, Timestamp.valueOf(fechaEmision), id);
    }

    /** Inactiva lógicamente una fórmula sin borrar su registro. */
    public void inactivar(Long id) { jdbc.update("UPDATE formula_medica SET activo=0,fecha_actualizacion_registro=CURRENT_TIMESTAMP WHERE id=? AND activo=1", id); }
}
