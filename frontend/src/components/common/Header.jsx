import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Menu,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const Header = ({ user }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    if (user?.is_staff) {
      navigate('/admin/profile');
    } else {
      navigate('/client/profile');
    }
  };

  const handleLogout = () => {
    handleClose();
    authService.logout();
    navigate('/login');
  };

  const displayName = user
    ? user.is_staff
      ? `Адміністратор ${user.first_name || ''} ${user.last_name || ''}`.trim() || `Адміністратор ${user.username}`
      : `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Користувач';

  return (
    <AppBar position="sticky" sx={{ backgroundColor: 'primary.main', zIndex: 1300 }}>
      <Toolbar sx={{ minHeight: '64px !important', paddingLeft: '24px !important', paddingRight: '24px !important' }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 600, 
            color: '#FAF0E6',
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            },
          }}
          onClick={() => navigate('/client/catalog')}
        >
          Спортивний центр
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              padding: '6px 16px',
              borderRadius: 2,
              transition: 'background-color 0.2s',
              minWidth: 'fit-content',
              '&:hover': {
                backgroundColor: '#153D33', 
              },
            }}
            onClick={handleMenu}
          >
            <Avatar 
              key={`header-${user?.photo || 'no-photo'}-${Date.now()}`} // Додаємо key для примусового оновлення
              src={user?.photo || null}
              sx={{ width: 36, height: 36, bgcolor: '#BB6830', color: '#FAF0E6', flexShrink: 0 }}
            >
              {user?.first_name?.[0] || user?.username?.[0] || 'U'}
            </Avatar>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#FAF0E6', 
                fontWeight: 500,
                fontSize: '1rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {displayName}
            </Typography>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleProfile}>
              <PersonIcon sx={{ mr: 1 }} />
              Профіль
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Вийти
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

