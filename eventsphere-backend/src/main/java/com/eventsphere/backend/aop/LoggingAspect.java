package com.eventsphere.backend.aop;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Logging aspect — wraps every controller and service method.
 *
 * Logs on every method call:
 *   → Entry  : class, method name, arguments (passwords masked)
 *   → Exit   : execution time in milliseconds
 *   → Error  : exception class and message (does NOT suppress the exception)
 *
 * Password masking: any argument whose toString() contains "password", "Password",
 * "hash", or "Hash" is replaced with "***" in the log to prevent credential leakage.
 *
 * Output goes to logs/eventsphere.log (configured in application.properties).
 *
 * Build order note: This aspect is built last (Step 11) because it wraps
 * all other layers. If built earlier, pointcuts would find no targets.
 */
@Aspect
@Component
@Slf4j
public class LoggingAspect {

    // ── Pointcuts ─────────────────────────────────────────────────────────────

    /** All public methods in any controller class */
    @Pointcut("within(com.eventsphere.backend.controller..*)")
    private void controllerLayer() {}

    /** All public methods in any service class */
    @Pointcut("within(com.eventsphere.backend.service..*)")
    private void serviceLayer() {}

    /** Combined pointcut — controllers + services */
    @Pointcut("controllerLayer() || serviceLayer()")
    private void applicationLayer() {}

    // ── Advice ────────────────────────────────────────────────────────────────

    /**
     * Logs method entry, exit, and execution time.
     * Re-throws any exception after logging — never swallows exceptions.
     */
    @Around("applicationLayer()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {

        String className  = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        Object[] args     = joinPoint.getArgs();

        if (log.isDebugEnabled()) {
            log.debug("→ {}.{}() called with args: {}",
                    className, methodName, maskSensitiveArgs(args));
        }

        long start = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long elapsed  = System.currentTimeMillis() - start;
            log.debug("← {}.{}() completed in {}ms", className, methodName, elapsed);
            return result;

        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - start;
            log.error("✗ {}.{}() threw {} after {}ms — message: {}",
                    className, methodName,
                    ex.getClass().getSimpleName(),
                    elapsed,
                    ex.getMessage());
            throw ex; // always re-throw — GlobalExceptionHandler catches it
        }
    }

    // ── Private helper ────────────────────────────────────────────────────────

    /**
     * Replaces any argument whose string representation contains
     * a password-like keyword with "***".
     */
    private Object[] maskSensitiveArgs(Object[] args) {
        if (args == null || args.length == 0) return args;
        return Arrays.stream(args).map(arg -> {
            if (arg == null) return "null";
            String s = arg.toString().toLowerCase();
            if (s.contains("password") || s.contains("hash")
                    || s.contains("cvv") || s.contains("otp")
                    || s.contains("secret") || s.contains("token")) {
                return "***";
            }
            return arg;
        }).toArray();
    }
}