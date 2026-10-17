package com.uniminuto.clinica.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Genera y verifica hashes de contraseñas con PBKDF2-HMAC-SHA256 (incluido en
 * el JDK, sin dependencias externas). Cada contraseña lleva su propia sal
 * aleatoria, así dos usuarios con la misma clave tienen hashes distintos.
 * Formato guardado: {@code pbkdf2$iteraciones$salBase64$hashBase64}.
 */
public final class ClaveSegura {

    /**
     * Algoritmo de derivación.
     */
    private static final String ALGORITMO = "PBKDF2WithHmacSHA256";

    /**
     * Iteraciones de la derivación (hacen costoso un ataque de fuerza bruta).
     */
    private static final int ITERACIONES = 210_000;

    /**
     * Bytes de la sal.
     */
    private static final int BYTES_SAL = 16;

    /**
     * Bits del hash resultante.
     */
    private static final int BITS_HASH = 256;

    /**
     * Generador de números aleatorios seguro.
     */
    private static final SecureRandom ALEATORIO = new SecureRandom();

    /**
     * Clase utilitaria: no se instancia.
     */
    private ClaveSegura() {
    }

    /**
     * Genera el hash de una contraseña con una sal nueva.
     *
     * @param clave contraseña en texto plano.
     * @return hash en el formato de esta clase.
     */
    public static String generarHash(String clave) {
        byte[] sal = new byte[BYTES_SAL];
        ALEATORIO.nextBytes(sal);
        byte[] hash = derivar(clave, sal, ITERACIONES);
        Base64.Encoder b64 = Base64.getEncoder();
        return "pbkdf2$" + ITERACIONES + "$" + b64.encodeToString(sal) + "$" + b64.encodeToString(hash);
    }

    /**
     * Verifica una contraseña contra un hash guardado.
     *
     * @param clave       contraseña en texto plano.
     * @param hashGuardado hash en el formato de esta clase.
     * @return true si coinciden.
     */
    public static boolean verificar(String clave, String hashGuardado) {
        String[] partes = hashGuardado == null ? new String[0] : hashGuardado.split("\\$");
        if (partes.length != 4 || !"pbkdf2".equals(partes[0])) {
            return false;
        }
        Base64.Decoder b64 = Base64.getDecoder();
        byte[] esperado = b64.decode(partes[3]);
        byte[] calculado = derivar(clave, b64.decode(partes[2]), Integer.parseInt(partes[1]));
        return MessageDigest.isEqual(esperado, calculado);
    }

    /**
     * Deriva el hash de una contraseña con una sal y un número de iteraciones.
     *
     * @param clave       contraseña.
     * @param sal         sal.
     * @param iteraciones iteraciones.
     * @return bytes del hash.
     */
    private static byte[] derivar(String clave, byte[] sal, int iteraciones) {
        PBEKeySpec spec = new PBEKeySpec(clave.toCharArray(), sal, iteraciones, BITS_HASH);
        try {
            return SecretKeyFactory.getInstance(ALGORITMO).generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo calcular el hash de la contraseña", e);
        } finally {
            spec.clearPassword();
        }
    }
}
