import { supabaseAdmin, supabaseAnon } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import { loginSchema, registerSchema } from "../utils/validators.js";

export const authService = {
  async register(payload: unknown) {
    const data = registerSchema.parse(payload);

    // Use admin API so the account is confirmed immediately (no email link required).
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      user_metadata: { displayName: data.displayName },
      email_confirm: true
    });

    if (createError) {
      const message = createError.message.includes("already")
        ? "Email is already registered"
        : createError.message;
      throw new AppError(message, 409);
    }

    // Sign in to get a session token the client can use immediately.
    const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (signInError || !session.session) {
      throw new AppError("Account created but sign-in failed", 500);
    }

    return {
      token: session.session.access_token,
      user: {
        id: created.user.id,
        email: created.user.email,
        displayName: data.displayName
      }
    };
  },

  async login(payload: unknown) {
    const data = loginSchema.parse(payload);

    const { data: session, error } = await supabaseAnon.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error || !session.session) {
      throw new AppError("Invalid email or password", 401);
    }

    const displayName = (
      session.user.user_metadata as { displayName?: string } | undefined
    )?.displayName;

    return {
      token: session.session.access_token,
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName
      }
    };
  }
};
