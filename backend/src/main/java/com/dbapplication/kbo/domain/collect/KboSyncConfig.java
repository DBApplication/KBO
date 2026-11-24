package com.dbapplication.kbo.domain.collect;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** KBO 데이터 자동 수집: 설정 값 등록 + 예약 실행(@Scheduled) 켜기 */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(KboSyncProperties.class)
public class KboSyncConfig {
}
