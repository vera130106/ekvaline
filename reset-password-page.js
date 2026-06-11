(function initResetPasswordPage() {
  const api = window.EkvalineAPI;
  const emailInput = document.getElementById('resetEmailInput');
  const sendCodeBtn = document.getElementById('resetSendCodeBtn');
  const verifyForm = document.getElementById('resetVerifyForm');
  const passwordForm = document.getElementById('resetPasswordForm');
  const resetError = document.getElementById('resetError');
  const resetSuccess = document.getElementById('resetSuccess');
  const resetDevCode = document.getElementById('resetDevCode');
  const strengthLine = document.getElementById('resetPasswordStrengthLine');

  let codeAccepted = false;
  let acceptedCode = '';
  let sendSeq = 0;

  function normalizeCode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 6);
  }

  function bindCodeInput(input) {
    if (!(input instanceof HTMLInputElement)) return;
    input.addEventListener('input', () => {
      input.value = normalizeCode(input.value);
    });
  }

  function getEmail() {
    return String(emailInput instanceof HTMLInputElement ? emailInput.value : '').trim().toLowerCase();
  }

  function validatePasswordForSubmit(password) {
    const authPwd = window.EkvalineAuthPassword;
    if (authPwd?.validatePassword) return authPwd.validatePassword(password);
    const p = String(password || '');
    if (p.length < 8) return { ok: false, error: 'Пароль: минимум 8 символов.' };
    return {
      ok: false,
      error: authPwd?.PASSWORD_RULES_HINT || 'Пароль не соответствует требованиям системы.',
    };
  }

  function setButtonLoading(btn, loading) {
    if (!(btn instanceof HTMLButtonElement)) return;
    const spinner = btn.querySelector('.cabinet-btn-spinner');
    btn.classList.toggle('is-loading', !!loading);
    btn.disabled = !!loading;
    btn.setAttribute('aria-busy', loading ? 'true' : 'false');
    if (spinner instanceof HTMLElement) spinner.hidden = !loading;
  }

  function setPasswordFieldsEnabled(enabled) {
    if (!(passwordForm instanceof HTMLFormElement)) return;
    const pwd = passwordForm.elements.namedItem('password');
    const pwd2 = passwordForm.elements.namedItem('passwordConfirm');
    const saveBtn = document.getElementById('resetSavePasswordBtn');
    if (pwd instanceof HTMLInputElement) pwd.disabled = !enabled;
    if (pwd2 instanceof HTMLInputElement) pwd2.disabled = !enabled;
    if (!enabled) {
      if (saveBtn instanceof HTMLButtonElement) saveBtn.disabled = true;
      if (strengthLine instanceof HTMLElement) strengthLine.textContent = '';
      return;
    }
    syncPasswordSubmitState();
    window.EkvalinePasswordVisibility?.init(passwordForm || document);
  }

  function syncPasswordSubmitState() {
    if (!(passwordForm instanceof HTMLFormElement)) return;
    const saveBtn = document.getElementById('resetSavePasswordBtn');
    if (!(saveBtn instanceof HTMLButtonElement)) return;
    if (!codeAccepted) {
      saveBtn.disabled = true;
      return;
    }
    const password = String(passwordForm.elements.namedItem('password')?.value || '');
    const passwordConfirm = String(passwordForm.elements.namedItem('passwordConfirm')?.value || '');
    const st = window.EkvalineAuthPassword?.getPasswordStrength?.(password);
    if (strengthLine instanceof HTMLElement && st?.line) {
      strengthLine.textContent = st.line;
      strengthLine.className = `cabinet-password-strength-line is-${st.level || 'weak'}`;
    }
    const pwdCheck = validatePasswordForSubmit(password);
    saveBtn.disabled = !pwdCheck.ok || password !== passwordConfirm;
  }

  function resetFlow() {
    codeAccepted = false;
    acceptedCode = '';
    if (verifyForm instanceof HTMLFormElement) {
      verifyForm.hidden = true;
      verifyForm.reset();
      const codeInput = verifyForm.elements.namedItem('code');
      if (codeInput instanceof HTMLInputElement) codeInput.readOnly = false;
      const checkBtn = document.getElementById('resetCheckCodeBtn');
      if (checkBtn instanceof HTMLButtonElement) checkBtn.disabled = false;
    }
    if (passwordForm instanceof HTMLFormElement) {
      passwordForm.hidden = true;
      passwordForm.reset();
    }
    setPasswordFieldsEnabled(false);
    if (resetDevCode instanceof HTMLElement) {
      resetDevCode.hidden = true;
      resetDevCode.innerHTML = '';
    }
  }

  function showAfterCodeSent() {
    resetFlow();
    if (verifyForm instanceof HTMLElement) {
      verifyForm.hidden = false;
      const codeInput = verifyForm.elements.namedItem('code');
      if (codeInput instanceof HTMLInputElement) {
        codeInput.value = '';
        codeInput.focus();
      }
    }
    if (resetSuccess) {
      resetSuccess.textContent =
        'Код отправлен. Если нажимали кнопку несколько раз — введите код из последнего письма.';
    }
  }

  function showAfterCodeVerified(code) {
    codeAccepted = true;
    acceptedCode = code;
    if (verifyForm instanceof HTMLFormElement) {
      verifyForm.hidden = false;
      const codeInput = verifyForm.elements.namedItem('code');
      if (codeInput instanceof HTMLInputElement) {
        codeInput.value = code;
        codeInput.readOnly = true;
      }
      const checkBtn = document.getElementById('resetCheckCodeBtn');
      if (checkBtn instanceof HTMLButtonElement) checkBtn.disabled = true;
    }
    if (passwordForm instanceof HTMLElement) {
      passwordForm.hidden = false;
      setPasswordFieldsEnabled(true);
      const pwd = passwordForm.elements.namedItem('password');
      if (pwd instanceof HTMLInputElement) pwd.focus();
    }
  }

  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get('email');
  if (emailFromUrl && emailInput instanceof HTMLInputElement) {
    emailInput.value = emailFromUrl.trim().toLowerCase();
  }

  if (sendCodeBtn instanceof HTMLButtonElement) {
    sendCodeBtn.addEventListener('click', async () => {
      if (!api) {
        if (resetError) resetError.textContent = 'Сервер недоступен. Обновите страницу.';
        return;
      }
      const email = getEmail();
      if (!email) {
        if (resetError) resetError.textContent = 'Укажите email.';
        return;
      }
      const seq = ++sendSeq;
      await (async () => {
        setButtonLoading(sendCodeBtn, true);
        if (resetError) resetError.textContent = '';
        if (resetSuccess) resetSuccess.textContent = '';
        try {
          const response = await api.json('/api/auth/forgot-password', { method: 'POST', body: { email } });
          if (seq !== sendSeq) return;
          if (!response.ok) {
            if (resetError) {
              resetError.textContent =
                response.data?.error ||
                (response.status === 404 ? 'Аккаунт с таким email не найден.' : 'Не удалось отправить код.');
            }
            return;
          }
          api.resetCsrf?.();
          showAfterCodeSent();
        } catch {
          if (resetError) resetError.textContent = 'Ошибка сети. Попробуйте позже.';
        } finally {
          setButtonLoading(sendCodeBtn, false);
        }
      })();
    });
  }

  if (verifyForm instanceof HTMLFormElement) {
    bindCodeInput(verifyForm.elements.namedItem('code'));
    verifyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!api) {
        if (resetError) resetError.textContent = 'Сервер недоступен.';
        return;
      }
      const email = getEmail();
      const code = normalizeCode(String(verifyForm.elements.namedItem('code')?.value || ''));
      if (!email) {
        if (resetError) resetError.textContent = 'Укажите email.';
        return;
      }
      if (code.length !== 6) {
        if (resetError) resetError.textContent = 'Введите 6-значный код из письма.';
        return;
      }
      const checkBtn = document.getElementById('resetCheckCodeBtn');
      await (async () => {
        setButtonLoading(checkBtn, true);
        if (resetError) resetError.textContent = '';
        try {
          const response = await api.json('/api/auth/verify-password-reset-code', {
            method: 'POST',
            body: { email, code },
          });
          if (!response.ok) {
            if (resetError) resetError.textContent = response.data?.error || 'Код не принят.';
            return;
          }
          api.resetCsrf?.();
          if (resetSuccess) {
            resetSuccess.textContent = response.data?.message || 'Код принят. Задайте новый пароль.';
          }
          showAfterCodeVerified(code);
        } catch {
          if (resetError) resetError.textContent = 'Ошибка сети.';
        } finally {
          setButtonLoading(checkBtn, false);
        }
      })();
    });
  }

  if (passwordForm instanceof HTMLFormElement) {
    [passwordForm.elements.namedItem('password'), passwordForm.elements.namedItem('passwordConfirm')].forEach(
      (node) => {
        if (node instanceof HTMLInputElement) {
          node.addEventListener('input', () => syncPasswordSubmitState());
        }
      }
    );
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!api) {
        if (resetError) resetError.textContent = 'Сервер недоступен.';
        return;
      }
      if (!codeAccepted || !acceptedCode) {
        if (resetError) resetError.textContent = 'Сначала проверьте код из письма.';
        return;
      }
      const email = getEmail();
      const password = String(passwordForm.elements.namedItem('password')?.value || '');
      const passwordConfirm = String(passwordForm.elements.namedItem('passwordConfirm')?.value || '');
      const pwdCheck = validatePasswordForSubmit(password);
      if (!pwdCheck.ok) {
        if (resetError) resetError.textContent = pwdCheck.error;
        return;
      }
      if (password !== passwordConfirm) {
        if (resetError) resetError.textContent = 'Пароли не совпадают.';
        return;
      }
      const saveBtn = document.getElementById('resetSavePasswordBtn');
      await (async () => {
        setButtonLoading(saveBtn, true);
        if (resetError) resetError.textContent = '';
        try {
          const response = await api.json('/api/auth/reset-password-by-email', {
            method: 'POST',
            body: { email, code: acceptedCode, password },
          });
          if (!response.ok) {
            if (resetError) resetError.textContent = response.data?.error || 'Не удалось сменить пароль.';
            if (
              String(response.data?.error || '').includes('истёк') ||
              String(response.data?.error || '').includes('Неверный')
            ) {
              resetFlow();
            }
            return;
          }
          api.resetCsrf?.();
          if (resetSuccess) {
            resetSuccess.textContent = response.data?.message || 'Пароль обновлён.';
          }
          resetFlow();
          window.setTimeout(() => {
            window.location.href = 'index.html?need-login=1';
          }, 1800);
        } catch {
          if (resetError) resetError.textContent = 'Ошибка сети.';
        } finally {
          setButtonLoading(saveBtn, false);
        }
      })();
    });
  }
})();
