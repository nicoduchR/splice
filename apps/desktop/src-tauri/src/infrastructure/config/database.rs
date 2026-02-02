use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use sqlx::migrate::Migrator;
use std::path::PathBuf;
use tracing::{info, error};

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

/// Get database directory path platform-specific
pub fn get_db_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    #[cfg(target_os = "macos")]
    {
        // macOS: ~/.splice/db/
        let home = dirs::home_dir()
            .ok_or("Failed to get home directory. Please ensure HOME environment variable is set.")?;
        Ok(home.join(".splice").join("db"))
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: %APPDATA%/splice/db/
        let config = dirs::config_dir()
            .ok_or("Failed to get AppData directory. Please ensure APPDATA environment variable is set.")?;
        Ok(config.join("splice").join("db"))
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        // Linux: ~/.local/share/splice/db/
        let data_dir = dirs::data_local_dir()
            .ok_or("Failed to get local data directory. Please ensure XDG_DATA_HOME or HOME is set.")?;
        Ok(data_dir.join("splice").join("db"))
    }
}

/// Get full database file path
pub fn get_db_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(get_db_dir()?.join("splice.db"))
}

/// Initialize SQLite database with migrations
pub async fn init_database() -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let db_path = get_db_path()?;

    info!("Database path: {:?}", db_path);

    // Create parent directory if needed
    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            info!("Creating database directory: {:?}", parent);
            std::fs::create_dir_all(parent)?;
        }
    }

    // Connect to database
    // mode=rwc: read-write-create (creates file if it doesn't exist)
    let connection_string = format!("sqlite:{}?mode=rwc", db_path.display());
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&connection_string)
        .await?;

    // Run migrations
    info!("Running database migrations");
    match MIGRATOR.run(&pool).await {
        Ok(_) => {
            info!("Database migrations completed successfully");
        }
        Err(e) => {
            error!("Database migration failed: {}", e);
            return Err(Box::new(e));
        }
    }

    Ok(pool)
}
