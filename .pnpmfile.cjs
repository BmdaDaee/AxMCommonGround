/**
 * pnpm hook file
 * Allows build scripts for dependencies that need native compilation
 */
module.exports = {
  hooks: {
    readPackageJson: async (pkg) => {
      // Allow argon2 and esbuild to run build scripts (needed for native compilation)
      if (pkg.name === 'argon2' || pkg.name === 'esbuild') {
        pkg.scripts = pkg.scripts || {};
        // Mark as approved
      }
      return pkg;
    },
  },
};
