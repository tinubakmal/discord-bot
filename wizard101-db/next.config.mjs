/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // En local, on autorise les images distantes de placeholder / wiki pour le prototype.
    // A restreindre a un domaine precis avant une mise en ligne.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
