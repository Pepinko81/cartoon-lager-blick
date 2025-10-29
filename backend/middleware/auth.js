import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lager_geheimnis_key_2024";

// Auth-Middleware für geschützte Routen
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      nachricht: "Nicht autorisiert - Token fehlt",
      fehler: true,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.benutzer = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      nachricht: "Nicht autorisiert - Ungültiger Token",
      fehler: true,
    });
  }
};

export { JWT_SECRET };

