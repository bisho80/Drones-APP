import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { login } from "../slices/authSlice";
import { useI18n } from "../i18n/i18n";

export default function LoginPage() {
  const dispatch = useDispatch();
  const { language, toggleLanguage, t } = useI18n();
  const { token, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ username: "beirut.super", password: "Super@123" });

  if (token) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    await dispatch(login(form));
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, background: "linear-gradient(135deg,#d9f1ec,#fef3e2)" }}>
      <Paper sx={{ p: 3, width: "100%", maxWidth: 420 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{t("loginTitle")}</Typography>
          <Button size="small" variant="outlined" onClick={toggleLanguage}>
            {language === "en" ? "AR" : "EN"}
          </Button>
        </Stack>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <TextField label={t("username")} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <TextField label={t("password")} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? t("signingIn") : t("login")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
