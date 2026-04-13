package com.eventsphere.backend.security;

import com.eventsphere.backend.entity.Admin;
import com.eventsphere.backend.entity.Organiser;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.repository.AdminRepository;
import com.eventsphere.backend.repository.OrganiserRepository;
import com.eventsphere.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Loads the principal from Oracle based on username.
 * Searched in this order: Admin → Organiser → User.
 *
 * Spring Security calls this during form-login.
 * For JWT-based authentication we bypass this via JwtAuthFilter,
 * but Spring Security still requires the bean to exist.
 *
 * Password is not checked here — comparison happens in AuthService
 * using PasswordUtil.matches() against the SHA-256 stored hash.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository     adminRepository;
    private final OrganiserRepository organiserRepository;
    private final UserRepository      userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // Check admins first
        java.util.Optional<Admin> admin = adminRepository.findByAdminUsername(username);
        if (admin.isPresent()) {
            Admin a = admin.get();
            return new org.springframework.security.core.userdetails.User(
                    a.getAdminUsername(),
                    a.getAdminPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
        }

        // Check organisers
        java.util.Optional<Organiser> organiser = organiserRepository.findByOrganiserUsername(username);
        if (organiser.isPresent()) {
            Organiser o = organiser.get();
            return new org.springframework.security.core.userdetails.User(
                    o.getOrganiserUsername(),
                    o.getOrganiserPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_ORGANISER"))
            );
        }

        // Check users
        java.util.Optional<User> user = userRepository.findByUserUsername(username);
        if (user.isPresent()) {
            User u = user.get();
            return new org.springframework.security.core.userdetails.User(
                    u.getUserUsername(),
                    u.getUserPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );
        }

        throw new UsernameNotFoundException("No account found with username: " + username);
    }
}