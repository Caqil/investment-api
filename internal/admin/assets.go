package admin

import (
	"os"
	"path/filepath"

	"github.com/qor/assetfs"
)

// AssetManager manages assets for the admin interface
type AssetManager struct {
	AssetFS assetfs.Interface
}

// NewAssetManager creates a new asset manager
func NewAssetManager() *AssetManager {
	// Create asset fs
	fs := assetfs.AssetFS().NameSpace("admin")

	// Register admin assets
	fs.RegisterPath(filepath.Join("public", "admin"))

	// Ensure admin assets directory exists
	ensureAdminAssetsDirectory()

	return &AssetManager{
		AssetFS: fs,
	}
}

// ensureAdminAssetsDirectory ensures admin assets directory exists
func ensureAdminAssetsDirectory() {
	// Create admin directories if they don't exist
	dirs := []string{
		"public/admin",
		"public/admin/css",
		"public/admin/js",
		"public/admin/images",
	}

	for _, dir := range dirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			err = os.MkdirAll(dir, 0755)
			if err != nil {
				// Log but continue
			}
		}
	}

	// Create default admin.css if it doesn't exist
	cssFile := filepath.Join("public", "admin", "css", "admin.css")
	if _, err := os.Stat(cssFile); os.IsNotExist(err) {
		defaultCSS := `
/* Custom admin styles */
.admin-header {
    background-color: #2d3748;
    color: #fff;
}

.admin-sidebar {
    background-color: #f8f9fa;
}

.admin-content {
    padding: 20px;
}

.admin-footer {
    background-color: #f8f9fa;
    padding: 10px 0;
    text-align: center;
    margin-top: 20px;
}
`
		os.WriteFile(cssFile, []byte(defaultCSS), 0644)
	}

	// Create default admin.js if it doesn't exist
	jsFile := filepath.Join("public", "admin", "js", "admin.js")
	if _, err := os.Stat(jsFile); os.IsNotExist(err) {
		defaultJS := `
// Custom admin scripts
$(document).ready(function() {
    // Initialize admin components
    console.log("Admin interface initialized");
    
    // Add event listeners
    $(".admin-sidebar-toggle").on("click", function() {
        $(".admin-sidebar").toggleClass("collapsed");
    });
});
`
		os.WriteFile(jsFile, []byte(defaultJS), 0644)
	}
}
