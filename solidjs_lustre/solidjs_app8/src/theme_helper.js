// src/theme_helper.js
export function toggle_html_theme(is_dark) {
  if (is_dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

