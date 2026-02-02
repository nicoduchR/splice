use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;
use std::path::PathBuf;
use tracing::info;

pub async fn init_database() -> Result<SqlitePool, sqlx::Error> {
    // Get app data directory
    let app_data_dir = dirs::data_dir()
        .map(|dir| dir.join("splice"))
        .unwrap_or_else(|| PathBuf::from("./data"));

    // Create directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir)
        .expect("Failed to create app data directory");

    let db_path = app_data_dir.join("splice.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.display());

    info!("Initializing database at: {}", db_path.display());

    // Create connection pool
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    info!("Database initialized successfully");

    Ok(pool)
}
