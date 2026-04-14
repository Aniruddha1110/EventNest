package com.eventsphere.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.*;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * Primary DataSource configuration — Oracle 26ai Free (FREEPDB1).
 *
 * Scans entity package:    com.eventsphere.backend.entity
 *                          (NOT entity.bank — that belongs to H2DataSourceConfig)
 * Scans repository package: com.eventsphere.backend.repository
 *                           (NOT repository.bank — that belongs to H2DataSourceConfig)
 *
 * @Primary tells Spring Boot to use this DataSource by default everywhere
 * that does not explicitly specify the H2 datasource.
 */
@Configuration
@EnableJpaRepositories(
        basePackages         = "com.eventsphere.backend.repository",
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.REGEX,
                pattern = "com\\.eventsphere\\.backend\\.repository\\.(bank|h2)\\..*"
        ),
        entityManagerFactoryRef = "oracleEntityManagerFactory",
        transactionManagerRef   = "oracleTransactionManager"
)
public class OracleDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource oracleDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public LocalContainerEntityManagerFactoryBean oracleEntityManagerFactory() {
        LocalContainerEntityManagerFactoryBean factory =
                new LocalContainerEntityManagerFactoryBean();

        factory.setDataSource(oracleDataSource());

        factory.setPersistenceUnitName("oracle");

        factory.setPackagesToScan("com.eventsphere.backend.entity");

        factory.setPersistenceUnitPostProcessors(pui -> {
            pui.getManagedClassNames().removeIf(className ->
                    className.contains(".entity.bank.") || className.contains(".entity.h2.")
            );
        });

        factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        Map<String, Object> props = new HashMap<>();
        props.put("hibernate.hbm2ddl.auto",               "validate");
        props.put("hibernate.dialect",                     "org.hibernate.dialect.OracleDialect");
        props.put("hibernate.show_sql",                    "true");
        props.put("hibernate.format_sql",                  "true");
        factory.setJpaPropertyMap(props);

        return factory;
    }

    @Bean
    @Primary
    public PlatformTransactionManager oracleTransactionManager() {
        JpaTransactionManager txManager = new JpaTransactionManager();
        txManager.setEntityManagerFactory(oracleEntityManagerFactory().getObject());
        return txManager;
    }
}