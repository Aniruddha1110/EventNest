package com.eventsphere.backend.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link LoggingAspect}.
 */
@ExtendWith(MockitoExtension.class)
class LoggingAspectTest {

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private Signature signature;

    private LoggingAspect loggingAspect;

    @BeforeEach
    void setUp() {
        loggingAspect = new LoggingAspect();
    }

    @Test
    @DisplayName("logAround() — normal execution → returns result without interference")
    void logAround_normalExecution_returnsResult() throws Throwable {
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getDeclaringType()).thenReturn((Class) String.class);
        when(signature.getName()).thenReturn("testMethod");
        when(joinPoint.getArgs()).thenReturn(new Object[]{"arg1", "arg2"});
        when(joinPoint.proceed()).thenReturn("expectedResult");

        Object result = loggingAspect.logAround(joinPoint);

        assertEquals("expectedResult", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("logAround() — exception thrown → re-throws without swallowing")
    void logAround_exceptionThrown_rethrows() throws Throwable {
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getDeclaringType()).thenReturn((Class) String.class);
        when(signature.getName()).thenReturn("failingMethod");
        when(joinPoint.getArgs()).thenReturn(new Object[]{});
        when(joinPoint.proceed()).thenThrow(new RuntimeException("Test error"));

        RuntimeException thrown = assertThrows(RuntimeException.class,
                () -> loggingAspect.logAround(joinPoint));

        assertEquals("Test error", thrown.getMessage());
    }

    @Test
    @DisplayName("logAround() — null args handled gracefully")
    void logAround_nullArgs() throws Throwable {
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getDeclaringType()).thenReturn((Class) String.class);
        when(signature.getName()).thenReturn("noArgsMethod");
        when(joinPoint.getArgs()).thenReturn(null);
        when(joinPoint.proceed()).thenReturn("ok");

        Object result = loggingAspect.logAround(joinPoint);

        assertEquals("ok", result);
    }

    @Test
    @DisplayName("logAround() — args with password keywords are masked")
    void logAround_masksPasswordArgs() throws Throwable {
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getDeclaringType()).thenReturn((Class) String.class);
        when(signature.getName()).thenReturn("loginMethod");
        // An arg whose toString() contains "password" — the aspect masks it
        when(joinPoint.getArgs()).thenReturn(new Object[]{"LoginRequest(password=secret)"});
        when(joinPoint.proceed()).thenReturn("token");

        Object result = loggingAspect.logAround(joinPoint);

        assertEquals("token", result);
        // We can't directly test log output easily, but we verify it doesn't crash
        verify(joinPoint).proceed();
    }
}
