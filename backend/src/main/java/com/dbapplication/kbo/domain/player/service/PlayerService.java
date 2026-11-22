package com.dbapplication.kbo.domain.player.service;

import com.dbapplication.kbo.domain.player.dto.PlayerDetailResponse;
import com.dbapplication.kbo.domain.player.dto.PlayerSearchItem;
import com.dbapplication.kbo.domain.player.dto.PlayerType;
import com.dbapplication.kbo.domain.player.entity.Player;
import com.dbapplication.kbo.domain.player.repository.PlayerRepository;
import com.dbapplication.kbo.global.dto.PageResponse;
import com.dbapplication.kbo.global.error.BusinessException;
import com.dbapplication.kbo.global.error.ErrorCode;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlayerService {

    private static final int MAX_SIZE = 50;

    private final PlayerRepository playerRepository;

    public PlayerDetailResponse getDetail(Long id) {
        Player player = playerRepository.findWithTeamById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.PLAYER_NOT_FOUND));
        return PlayerDetailResponse.from(player);
    }

    public PageResponse<PlayerSearchItem> search(String keyword, Long teamId, PlayerType type, int page, int size) {
        List<Specification<Player>> specs = new ArrayList<>();
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + escapeLike(keyword.trim().toLowerCase()) + "%";
            specs.add((root, q, cb) -> cb.like(cb.lower(root.get("name")), pattern, '\\'));
        }
        if (teamId != null) {
            specs.add((root, q, cb) -> cb.equal(root.get("team").get("id"), teamId));
        }
        if (type == PlayerType.PITCHER) {
            specs.add((root, q, cb) -> cb.equal(root.get("position"), PlayerType.PITCHER_POSITION));
        } else if (type == PlayerType.BATTER) {
            specs.add((root, q, cb) -> cb.or(cb.isNull(root.get("position")),
                    cb.notEqual(root.get("position"), PlayerType.PITCHER_POSITION)));
        }
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_SIZE),
                Sort.by("name").and(Sort.by("id")));
        return PageResponse.of(playerRepository.findAll(Specification.allOf(specs), pageable),
                PlayerSearchItem::from);
    }

    static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
