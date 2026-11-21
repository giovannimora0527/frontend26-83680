package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bloqueo pesimista con datos frescos: escribe pendientes, recarga el registro
 * desde la BD y lo bloquea (SELECT ... FOR UPDATE) hasta el fin de la transacción.
 */
@Component
public class Bloqueos {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.MANDATORY)
    public <T> T bloquear(Class<T> tipo, Object id, String mensajeNoExiste) {
        T entidad = entityManager.find(tipo, id);
        if (entidad == null) {
            throw new NotFoundException(mensajeNoExiste);
        }
        entityManager.flush();
        entityManager.refresh(entidad, LockModeType.PESSIMISTIC_WRITE);
        return entidad;
    }
}
