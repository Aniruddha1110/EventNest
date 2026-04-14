package com.eventsphere.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * Secondary DataSource configuration — H2 in-memory.
 *
 * Manages TWO groups of H2 tables:
 *
 * GROUP 1 — Bank (original):
 *   entity.bank  → BankAccount, Transaction
 *   repository.bank → BankAccountRepository, TransactionRepository
 *
 * GROUP 2 — Event metadata (new for Topic 3):
 *   entity.h2    → EventMetadata, EventFeedback, ProgrammeMeta
 *   repository.h2 → EventMetadataRepository, EventFeedbackRepository, ProgrammeMetaRepository
 *
 * All H2 tables are created fresh on every startup (ddl-auto = create-drop)
 * and seeded by DataLoader.onApplicationEvent().
 *
 * IMPORTANT: The entity packages listed here must NEVER overlap with
 * OracleDataSourceConfig — Hibernate will throw a conflicting EntityManager error.
 */
@Configuration
@EnableJpaRepositories(
        basePackages = {
                "com.eventsphere.backend.repository.bank",   // BankAccount, Transaction repos
                "com.eventsphere.backend.repository.h2"      // EventMetadata, EventFeedback, ProgrammeMeta repos
        },
        entityManagerFactoryRef = "h2EntityManagerFactory",
        transactionManagerRef   = "h2TransactionManager"
)
public class H2DataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "bank.datasource")
    public DataSource h2DataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean h2EntityManagerFactory() {
        LocalContainerEntityManagerFactoryBean factory =
                new LocalContainerEntityManagerFactoryBean();

        factory.setDataSource(h2DataSource());

        factory.setPersistenceUnitName("h2");

        factory.setPackagesToScan(
                "com.eventsphere.backend.entity.bank",   // BankAccount, Transaction
                "com.eventsphere.backend.entity.h2"      // EventMetadata, EventFeedback, ProgrammeMeta
        );
        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.hbm2ddl.auto", "create-drop"); // wipe and recreate on every start
        props.put("hibernate.dialect",      "org.hibernate.dialect.H2Dialect");
        props.put("hibernate.show_sql",     "true");
        factory.setJpaPropertyMap(props);

        return factory;
    }

    @Bean
    public PlatformTransactionManager h2TransactionManager() {
        JpaTransactionManager txManager = new JpaTransactionManager();
        txManager.setEntityManagerFactory(h2EntityManagerFactory().getObject());
        return txManager;
    }
}