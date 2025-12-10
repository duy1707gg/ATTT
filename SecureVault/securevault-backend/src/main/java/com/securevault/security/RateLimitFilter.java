package com.securevault.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Filter using Bucket4j
 * Limits requests to auth endpoints to prevent brute-force attacks
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Store buckets per IP address
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Rate limit: 10 requests per minute for auth endpoints
    private static final int AUTH_RATE_LIMIT = 10;
    private static final int AUTH_RATE_DURATION_MINUTES = 1;

    // Rate limit: 100 requests per minute for general endpoints
    private static final int GENERAL_RATE_LIMIT = 100;
    private static final int GENERAL_RATE_DURATION_MINUTES = 1;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String clientIp = getClientIP(request);
        String path = request.getRequestURI();

        // Determine rate limit based on endpoint
        Bucket bucket = resolveBucket(clientIp, path);

        if (bucket.tryConsume(1)) {
            // Add rate limit headers
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(bucket.getAvailableTokens()));
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\": \"Too many requests. Please try again later.\", \"message\": \"Rate limit exceeded\"}");
        }
    }

    private Bucket resolveBucket(String clientIp, String path) {
        String key = clientIp + ":" + (isAuthEndpoint(path) ? "auth" : "general");

        return buckets.computeIfAbsent(key, k -> {
            if (isAuthEndpoint(path)) {
                // Stricter limit for auth endpoints
                Bandwidth limit = Bandwidth.builder()
                        .capacity(AUTH_RATE_LIMIT)
                        .refillGreedy(AUTH_RATE_LIMIT, Duration.ofMinutes(AUTH_RATE_DURATION_MINUTES))
                        .build();
                return Bucket.builder().addLimit(limit).build();
            } else {
                // More lenient limit for general endpoints
                Bandwidth limit = Bandwidth.builder()
                        .capacity(GENERAL_RATE_LIMIT)
                        .refillGreedy(GENERAL_RATE_LIMIT, Duration.ofMinutes(GENERAL_RATE_DURATION_MINUTES))
                        .build();
                return Bucket.builder().addLimit(limit).build();
            }
        });
    }

    private boolean isAuthEndpoint(String path) {
        return path.startsWith("/api/auth/");
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Don't filter static resources or swagger
        String path = request.getRequestURI();
        return path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.endsWith(".css") ||
                path.endsWith(".js") ||
                path.endsWith(".ico");
    }
}
