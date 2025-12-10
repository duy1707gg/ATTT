package com.securevault.security.jwt;

import com.securevault.security.services.UserDetailsImpl;
import io.jsonwebtoken.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${securevault.app.jwtPrivateKey}")
    private String jwtPrivateKeyStr;

    @Value("${securevault.app.jwtPublicKey}")
    private String jwtPublicKeyStr;

    @Value("${securevault.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    private PrivateKey privateKey;
    private PublicKey publicKey;

    @PostConstruct
    public void init() {
        try {
            // Decode Base64 keys
            byte[] privateKeyBytes = Base64.getDecoder().decode(jwtPrivateKeyStr);
            byte[] publicKeyBytes = Base64.getDecoder().decode(jwtPublicKeyStr);

            KeyFactory keyFactory = KeyFactory.getInstance("RSA");

            PKCS8EncodedKeySpec privateKeySpec = new PKCS8EncodedKeySpec(privateKeyBytes);
            this.privateKey = keyFactory.generatePrivate(privateKeySpec);

            X509EncodedKeySpec publicKeySpec = new X509EncodedKeySpec(publicKeyBytes);
            this.publicKey = keyFactory.generatePublic(publicKeySpec);

            logger.info("JWT RSA keys initialized successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize RSA keys: {}", e.getMessage());
            throw new RuntimeException("Failed to initialize RSA keys", e);
        }
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject((userPrincipal.getUsername()))
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(publicKey).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(publicKey).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        } catch (io.jsonwebtoken.security.SignatureException e) {
            logger.error("JWT signature validation failed: {}", e.getMessage());
        }
        return false;
    }

    // Utility method to generate new RSA key pair (run once to generate keys)
    public static void main(String[] args) throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair pair = keyGen.generateKeyPair();

        String privateKeyBase64 = Base64.getEncoder().encodeToString(pair.getPrivate().getEncoded());
        String publicKeyBase64 = Base64.getEncoder().encodeToString(pair.getPublic().getEncoded());

        System.out.println("# Add these to application.properties:");
        System.out.println("securevault.app.jwtPrivateKey=" + privateKeyBase64);
        System.out.println("securevault.app.jwtPublicKey=" + publicKeyBase64);
    }
}
