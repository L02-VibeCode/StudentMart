# Testcontainers for .NET

Here's a complete sample of using Testcontainers for SQL Server database in .NET xUnit testing:

Complete SQL Server Testcontainers Example with xUnit

### 1. Create a Database Fixture

```cs
using Testcontainers.MsSql;
using Xunit;

public sealed class SqlServerFixture : IAsyncLifetime
{
    public MsSqlContainer MsSqlContainer { get; }

    public SqlServerFixture()
    {
        MsSqlContainer = new MsSqlBuilder()
            .WithPassword("YourStrong@Password1")
            .Build();
    }

    public Task InitializeAsync()
    {
        return MsSqlContainer.StartAsync();
    }

    public Task DisposeAsync()
    {
        return MsSqlContainer.DisposeAsync().AsTask();
    }
}
```

### 2. Create Test Class Using the Fixture

```cs
using System.Data;
using Microsoft.Data.SqlClient;
using Xunit;

public class SqlServerDatabaseTests : IClassFixture<SqlServerFixture>
{
    private readonly SqlServerFixture _fixture;

    public SqlServerDatabaseTests(SqlServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task TestDatabaseConnection()
    {
        // Arrange
        var connectionString = _fixture.MsSqlContainer.GetConnectionString();

        // Act
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        // Assert
        Assert.Equal(ConnectionState.Open, connection.State);

        await connection.CloseAsync();
    }

    [Fact]
    public async Task TestDatabaseQuery()
    {
        // Arrange
        var connectionString = _fixture.MsSqlContainer.GetConnectionString();

        // Act
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("SELECT @@VERSION", connection);
        var result = await command.ExecuteScalarAsync();

        // Assert
        Assert.NotNull(result);
        Assert.True(result.ToString()?.Contains("SQL Server") ?? false);

        await connection.CloseAsync();
    }

    [Fact]
    public async Task TestCreateTableAndInsertData()
    {
        // Arrange
        var connectionString = _fixture.MsSqlContainer.GetConnectionString();

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        // Act - Create table
        var createTableSql = @"
            CREATE TABLE Users (
                Id INT PRIMARY KEY IDENTITY(1,1),
                Name NVARCHAR(100),
                Email NVARCHAR(100)
            )";

        using (var createCommand = new SqlCommand(createTableSql, connection))
        {
            await createCommand.ExecuteNonQueryAsync();
        }

        // Act - Insert data
        var insertSql = "INSERT INTO Users (Name, Email) VALUES (@name, @email)";
        using (var insertCommand = new SqlCommand(insertSql, connection))
        {
            insertCommand.Parameters.AddWithValue("@name", "John Doe");
            insertCommand.Parameters.AddWithValue("@email", "john@example.com");
            await insertCommand.ExecuteNonQueryAsync();
        }

        // Act - Query data
        var querySql = "SELECT COUNT(*) FROM Users";
        using (var queryCommand = new SqlCommand(querySql, connection))
        {
            var result = await queryCommand.ExecuteScalarAsync();

            // Assert
            Assert.Equal(1, Convert.ToInt32(result));
        }

        await connection.CloseAsync();
    }
}
```

### 3. Collection Fixture (Optional - for Sharing Across Test Classes)

```cs
using Xunit;

[CollectionDefinition("SqlServer collection")]
public class SqlServerCollection : ICollectionFixture<SqlServerFixture>
{
    // This class has no code, and is never created.
    // Its purpose is simply to be the place to apply [CollectionDefinition]
}

[Collection("SqlServer collection")]
public class FirstDatabaseTests
{
    private readonly SqlServerFixture _fixture;

    public FirstDatabaseTests(SqlServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Test1()
    {
        var connectionString = _fixture.MsSqlContainer.GetConnectionString();
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        Assert.Equal(ConnectionState.Open, connection.State);
    }
}

[Collection("SqlServer collection")]
public class SecondDatabaseTests
{
    private readonly SqlServerFixture _fixture;

    public SecondDatabaseTests(SqlServerFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Test2()
    {
        // Shares same MsSqlContainer instance as FirstDatabaseTests
        var connectionString = _fixture.MsSqlContainer.GetConnectionString();
        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();
        Assert.Equal(ConnectionState.Open, connection.State);
    }
}
```

Key Features:
IAsyncLifetime: Manages container startup (InitializeAsync) and cleanup (DisposeAsync)
Class Fixture: IClassFixture<SqlServerFixture> shares the same container instance across all tests in a class
Collection Fixture: Share containers across multiple test classes
GetConnectionString(): Gets the connection string automatically with correct host, port, and credentials
Automatic Cleanup: Container is automatically stopped and removed after tests complete
This approach ensures efficient test execution with minimal overhead while maintaining clean separation of concerns!

## Core APIs

### ContainerBuilder - Creating and configuring containers

The primary API for creating Docker containers with a fluent, immutable builder pattern. Supports configuration of images, ports, environment variables, networks, volumes, wait strategies, and lifecycle callbacks.

```csharp
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;

// Create an NGINX container with port binding and wait strategy
const ushort HttpPort = 80;

var container = new ContainerBuilder()
    .WithImage("nginx:latest")
    .WithName("my-nginx-test")
    .WithPortBinding(HttpPort, true) // Bind to random host port
    .WithEnvironment("NGINX_HOST", "localhost")
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilHttpRequestIsSucceeded(r => r.ForPort(HttpPort).ForPath("/")))
    .WithCleanUp(true) // Auto-cleanup after test
    .Build();

// Start the container
await container.StartAsync();

// Use the container in tests
var mappedPort = container.GetMappedPublicPort(HttpPort);
var baseUrl = $"http://{container.Hostname}:{mappedPort}";

using var httpClient = new HttpClient { BaseAddress = new Uri(baseUrl) };
var response = await httpClient.GetAsync("/");
Console.WriteLine($"Status: {response.StatusCode}");

// Cleanup (or use 'await using' for automatic disposal)
await container.DisposeAsync();
```

### IContainer - Interacting with running containers

Interface for managing container lifecycle and executing operations on running containers, including starting, stopping, executing commands, copying files, and retrieving logs.

```csharp
using DotNet.Testcontainers.Containers;
using System.Net;

var container = new ContainerBuilder()
    .WithImage("alpine:latest")
    .WithCommand("tail", "-f", "/dev/null") // Keep container running
    .Build();

await container.StartAsync();

// Execute commands in the container
var execResult = await container.ExecAsync(new[] { "sh", "-c", "echo 'Hello from container'" });
Console.WriteLine($"Exit Code: {execResult.ExitCode}");
Console.WriteLine($"Output: {execResult.Stdout}");

// Copy files to the container
var fileContent = System.Text.Encoding.UTF8.GetBytes("Test configuration");
await container.CopyAsync(fileContent, "/tmp/config.txt");

// Read files from the container
var readBytes = await container.ReadFileAsync("/tmp/config.txt");
var content = System.Text.Encoding.UTF8.GetString(readBytes);
Console.WriteLine($"File content: {content}");

// Get container logs
var (stdout, stderr) = await container.GetLogsAsync();
Console.WriteLine($"Container logs:\n{stdout}");

// Get port mappings
var ports = container.GetMappedPublicPorts();
foreach (var (containerPort, hostPort) in ports)
{
    Console.WriteLine($"Container port {containerPort} -> Host port {hostPort}");
}

// Container properties
Console.WriteLine($"Container ID: {container.Id}");
Console.WriteLine($"Container Name: {container.Name}");
Console.WriteLine($"IP Address: {container.IpAddress}");
Console.WriteLine($"State: {container.State}");

await container.StopAsync();
await container.DisposeAsync();
```

### Wait Strategies - Ensuring container readiness

Wait strategies determine when a container is ready for testing by checking various readiness indicators such as HTTP endpoints, log messages, TCP ports, command execution, file existence, or Docker health checks.

```csharp
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Configurations;
using System.Net;

// HTTP endpoint wait strategy
var webContainer = new ContainerBuilder()
    .WithImage("nginx:latest")
    .WithPortBinding(80, true)
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilHttpRequestIsSucceeded(request => request
            .ForPath("/health")
            .ForPort(80)
            .ForStatusCode(HttpStatusCode.OK)
            .ForStatusCode(HttpStatusCode.NoContent),
            waitStrategy => waitStrategy.WithTimeout(TimeSpan.FromMinutes(2))))
    .Build();

// Log message wait strategy
var appContainer = new ContainerBuilder()
    .WithImage("myapp:latest")
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilMessageIsLogged("Application started successfully",
            o => o.WithTimeout(TimeSpan.FromSeconds(30))))
    .Build();

// Command execution wait strategy
var dbContainer = new ContainerBuilder()
    .WithImage("postgres:15")
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilCommandIsCompleted("pg_isready", "--host", "localhost"))
    .Build();

// TCP port availability wait strategy
var serviceContainer = new ContainerBuilder()
    .WithImage("redis:7")
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilInternalTcpPortIsAvailable(6379))
    .Build();

// Multiple wait strategies combined
var complexContainer = new ContainerBuilder()
    .WithImage("myservice:latest")
    .WithPortBinding(8080, true)
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilInternalTcpPortIsAvailable(8080)
        .UntilHttpRequestIsSucceeded(r => r.ForPath("/health").ForPort(8080))
        .UntilMessageIsLogged("Ready to accept connections")
        .UntilFileExists("/tmp/ready.lock"))
    .Build();

// Docker HEALTHCHECK wait strategy
var healthyContainer = new ContainerBuilder()
    .WithImage("postgres:15") // Must have HEALTHCHECK in Dockerfile
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilContainerIsHealthy())
    .Build();

// OneShot mode for containers that exit after completing a task
var migrationContainer = new ContainerBuilder()
    .WithImage("migrations:latest")
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilMessageIsLogged("Migration completed",
            o => o.WithMode(WaitStrategyMode.OneShot)))
    .Build();

await webContainer.StartAsync();
// Container is now ready and accepting HTTP requests
```

### NetworkBuilder - Container network communication

Creates Docker networks to enable container-to-container communication with custom network isolation, aliases for service discovery, and support for different network drivers.

```csharp
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Configurations;

// Create a custom network
var network = new NetworkBuilder()
    .WithName("my-test-network")
    .WithDriver(NetworkDriver.Bridge)
    .Build();

await network.CreateAsync();

// Create containers that communicate via the network
var databaseContainer = new ContainerBuilder()
    .WithImage("postgres:15")
    .WithNetwork(network)
    .WithNetworkAliases("database", "db") // Service discovery aliases
    .WithEnvironment("POSTGRES_PASSWORD", "secret")
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilCommandIsCompleted("pg_isready"))
    .Build();

var appContainer = new ContainerBuilder()
    .WithImage("myapp:latest")
    .WithNetwork(network)
    .WithNetworkAliases("app")
    .WithEnvironment("DATABASE_HOST", "database") // Use network alias
    .WithEnvironment("DATABASE_PORT", "5432")
    .WithEnvironment("DATABASE_PASSWORD", "secret")
    .WithPortBinding(8080, true) // Expose to host
    .DependsOn(databaseContainer) // Start database first
    .Build();

// Start containers in dependency order
await databaseContainer.StartAsync();
await appContainer.StartAsync();

// App can connect to database using hostname "database"
// Host can connect to app using mapped port
var appPort = appContainer.GetMappedPublicPort(8080);
Console.WriteLine($"App available at: http://{appContainer.Hostname}:{appPort}");

// Cleanup
await appContainer.DisposeAsync();
await databaseContainer.DisposeAsync();
await network.DeleteAsync();
```

### VolumeBuilder - Persistent data storage

Creates Docker volumes for persistent data storage that survives container restarts and can be shared between multiple containers.

```csharp
using DotNet.Testcontainers.Builders;

// Create a managed volume
var volume = new VolumeBuilder()
    .WithName("postgres-data")
    .Build();

await volume.CreateAsync();

// Use the volume in a container
var container = new ContainerBuilder()
    .WithImage("postgres:15")
    .WithVolumeMount(volume, "/var/lib/postgresql/data") // Mount volume
    .WithEnvironment("POSTGRES_PASSWORD", "secret")
    .Build();

await container.StartAsync();

// Data persists in the volume
// Stop and remove the container
await container.DisposeAsync();

// Start a new container with the same volume
var newContainer = new ContainerBuilder()
    .WithImage("postgres:15")
    .WithVolumeMount(volume, "/var/lib/postgresql/data")
    .WithEnvironment("POSTGRES_PASSWORD", "secret")
    .Build();

await newContainer.StartAsync();
// New container has access to data from previous container

// Cleanup
await newContainer.DisposeAsync();
await volume.DeleteAsync();
```

### ImageFromDockerfileBuilder - Building custom images

Builds Docker images from Dockerfiles with support for build arguments, multi-stage builds, custom build contexts, and automatic cleanup.

```csharp
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Images;

// Build an image from a Dockerfile in the solution directory
var futureImage = new ImageFromDockerfileBuilder()
    .WithName("myapp:test")
    .WithDockerfileDirectory(CommonDirectoryPath.GetSolutionDirectory(), string.Empty)
    .WithDockerfile("Dockerfile")
    .WithBuildArgument("VERSION", "1.0.0")
    .WithBuildArgument("ENVIRONMENT", "test")
    .WithDeleteIfExists(true) // Remove existing image with same name
    .Build();

// Create the image (build process runs here)
await futureImage.CreateAsync();

// Use the built image in a container
var container = new ContainerBuilder()
    .WithImage(futureImage)
    .WithPortBinding(8080, true)
    .WithEnvironment("ASPNETCORE_ENVIRONMENT", "Development")
    .Build();

await container.StartAsync();

var port = container.GetMappedPublicPort(8080);
Console.WriteLine($"Application running at: http://{container.Hostname}:{port}");

await container.DisposeAsync();

// Multi-stage build with specific target
var buildImage = new ImageFromDockerfileBuilder()
    .WithName("myapp:build-stage")
    .WithDockerfileDirectory("/path/to/project")
    .WithDockerfile("Dockerfile")
    .WithTarget("build") // Build specific stage in multi-stage Dockerfile
    .WithBuildArgument("CONFIGURATION", "Debug")
    .Build();

await buildImage.CreateAsync();

// Custom build context (different from Dockerfile location)
var contextImage = new ImageFromDockerfileBuilder()
    .WithName("myapp:custom-context")
    .WithContextDirectory("/path/to/build/context")
    .WithDockerfileDirectory("/path/to/dockerfile/location")
    .WithDockerfile("Dockerfile.custom")
    .Build();

await contextImage.CreateAsync();
```

### Resource Mapping - Copying files to containers

Copies files, directories, or byte content into containers before they start, supporting custom ownership and permissions for security requirements.

```csharp
using DotNet.Testcontainers.Builders;
using System.IO;

// Copy configuration files to container
var container = new ContainerBuilder()
    .WithImage("nginx:latest")
    .WithResourceMapping(new FileInfo("./nginx.conf"), "/etc/nginx/nginx.conf")
    .WithResourceMapping(new FileInfo("./ssl/certificate.pem"), "/etc/nginx/cert.pem")
    .WithResourceMapping(new DirectoryInfo("./html"), "/usr/share/nginx/html/")
    .Build();

// Copy byte array content
var configJson = System.Text.Encoding.UTF8.GetBytes("{\"key\": \"value\"}");
var apiContainer = new ContainerBuilder()
    .WithImage("myapi:latest")
    .WithResourceMapping(configJson, "/app/config.json")
    .Build();

// Copy with custom ownership and permissions (UID 1000, GID 1000, rwxr-xr-x)
var scriptContainer = new ContainerBuilder()
    .WithImage("alpine:latest")
    .WithResourceMapping(
        new FileInfo("./scripts/startup.sh"),
        "/scripts/startup.sh",
        uid: 1000,
        gid: 1000,
        fileMode: UnixFileModes.UserRead | UnixFileModes.UserWrite | UnixFileModes.UserExecute |
                  UnixFileModes.GroupRead | UnixFileModes.GroupExecute |
                  UnixFileModes.OtherRead | UnixFileModes.OtherExecute)
    .WithCommand("/scripts/startup.sh")
    .Build();

// Bind mount host directory (not recommended for CI environments)
var devContainer = new ContainerBuilder()
    .WithImage("node:18")
    .WithBindMount("/home/user/project", "/app", AccessMode.ReadWrite)
    .WithWorkingDirectory("/app")
    .WithCommand("npm", "start")
    .Build();

// Tmpfs mount for temporary data
var tempContainer = new ContainerBuilder()
    .WithImage("postgres:15")
    .WithTmpfsMount("/var/lib/postgresql/temp", AccessMode.ReadWrite)
    .Build();

await container.StartAsync();
```

### PostgreSQL Module - Pre-configured database container

Pre-configured PostgreSQL container with database initialization, connection string generation, and SQL script execution support.

```csharp
using Testcontainers.PostgreSql;

// Create PostgreSQL container with default configuration
var postgreSqlContainer = new PostgreSqlBuilder()
    .WithDatabase("testdb")
    .WithUsername("testuser")
    .WithPassword("testpass")
    .Build();

await postgreSqlContainer.StartAsync();

// Get connection string
var connectionString = postgreSqlContainer.GetConnectionString();
Console.WriteLine($"Connection string: {connectionString}");

// Execute SQL scripts
await postgreSqlContainer.ExecScriptAsync(@"
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
    );

    INSERT INTO users (username, email) VALUES
        ('john_doe', 'john@example.com'),
        ('jane_smith', 'jane@example.com');
");

// Use with ADO.NET
using var connection = new Npgsql.NpgsqlConnection(connectionString);
await connection.OpenAsync();

using var command = new Npgsql.NpgsqlCommand("SELECT COUNT(*) FROM users", connection);
var count = (long)await command.ExecuteScalarAsync();
Console.WriteLine($"User count: {count}"); // Output: 2

await connection.CloseAsync();
await postgreSqlContainer.DisposeAsync();
```

### Kafka Module - Pre-configured message broker

Pre-configured Kafka container supporting both KRaft and ZooKeeper consensus protocols with customizable listeners and network configuration.

```csharp
using Testcontainers.Kafka;
using Confluent.Kafka;

// Create Kafka container with KRaft (default for modern versions)
var kafkaContainer = new KafkaBuilder()
    .WithKRaft()
    .Build();

await kafkaContainer.StartAsync();

// Get bootstrap address
var bootstrapAddress = kafkaContainer.GetBootstrapAddress();
Console.WriteLine($"Kafka bootstrap: {bootstrapAddress}");

// Produce messages
var producerConfig = new ProducerConfig { BootstrapServers = bootstrapAddress };
using var producer = new ProducerBuilder<string, string>(producerConfig).Build();

for (int i = 0; i < 10; i++)
{
    var message = new Message<string, string>
    {
        Key = $"key-{i}",
        Value = $"Message {i}"
    };

    var result = await producer.ProduceAsync("test-topic", message);
    Console.WriteLine($"Produced: {result.Value} to {result.TopicPartitionOffset}");
}

// Consume messages
var consumerConfig = new ConsumerConfig
{
    BootstrapServers = bootstrapAddress,
    GroupId = "test-group",
    AutoOffsetReset = AutoOffsetReset.Earliest
};

using var consumer = new ConsumerBuilder<string, string>(consumerConfig).Build();
consumer.Subscribe("test-topic");

var consumedCount = 0;
while (consumedCount < 10)
{
    var consumeResult = consumer.Consume(TimeSpan.FromSeconds(10));
    if (consumeResult != null)
    {
        Console.WriteLine($"Consumed: {consumeResult.Message.Value}");
        consumedCount++;
    }
}

consumer.Close();
await kafkaContainer.DisposeAsync();

// Kafka with ZooKeeper (for older versions)
var zooKeeperKafka = new KafkaBuilder()
    .WithZooKeeper()
    .Build();

await zooKeeperKafka.StartAsync();
var zkBootstrap = zooKeeperKafka.GetBootstrapAddress();

// Custom listener for multi-container scenarios
var network = new NetworkBuilder().Build();
await network.CreateAsync();

var kafkaWithListener = new KafkaBuilder()
    .WithNetwork(network)
    .WithKRaft()
    .WithListener("kafka-broker:9092") // Custom listener
    .Build();

await kafkaWithListener.StartAsync();
```

### xUnit Integration - Test framework lifecycle management

First-class integration with xUnit test framework using class fixtures for automatic container lifecycle management across test classes.

```csharp
using Testcontainers.PostgreSql;
using Xunit;

// Class fixture for container shared across all tests in the class
public sealed class DatabaseFixture : IAsyncLifetime
{
    public PostgreSqlContainer PostgreSqlContainer { get; } = new PostgreSqlBuilder()
        .WithDatabase("testdb")
        .WithUsername("user")
        .WithPassword("password")
        .Build();

    public Task InitializeAsync()
    {
        return PostgreSqlContainer.StartAsync();
    }

    public Task DisposeAsync()
    {
        return PostgreSqlContainer.DisposeAsync().AsTask();
    }
}

// Test class using the fixture
public class DatabaseTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public DatabaseTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task TestDatabaseConnection()
    {
        var connectionString = _fixture.PostgreSqlContainer.GetConnectionString();

        using var connection = new Npgsql.NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        Assert.Equal(System.Data.ConnectionState.Open, connection.State);

        await connection.CloseAsync();
    }

    [Fact]
    public async Task TestDatabaseQuery()
    {
        var connectionString = _fixture.PostgreSqlContainer.GetConnectionString();

        using var connection = new Npgsql.NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        using var command = new Npgsql.NpgsqlCommand("SELECT 1", connection);
        var result = await command.ExecuteScalarAsync();

        Assert.Equal(1, Convert.ToInt32(result));

        await connection.CloseAsync();
    }
}

// Collection fixture for sharing across multiple test classes
[CollectionDefinition("Database collection")]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture>
{
    // This class has no code, and is never created.
    // Its purpose is simply to be the place to apply [CollectionDefinition]
}

[Collection("Database collection")]
public class FirstTestClass
{
    private readonly DatabaseFixture _fixture;

    public FirstTestClass(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void Test1()
    {
        // Use _fixture.PostgreSqlContainer
    }
}

[Collection("Database collection")]
public class SecondTestClass
{
    private readonly DatabaseFixture _fixture;

    public SecondTestClass(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void Test2()
    {
        // Shares same PostgreSqlContainer instance as FirstTestClass
    }
}
```

### Multi-Container Application Setup - Complex dependencies

Orchestrates multiple interconnected containers with dependencies, shared networks, and coordinated startup sequences for testing distributed systems.

```csharp
using DotNet.Testcontainers.Builders;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;

// Create shared network
var network = new NetworkBuilder()
    .WithName("app-network")
    .Build();

await network.CreateAsync();

// Create database container
var database = new PostgreSqlBuilder()
    .WithDatabase("appdb")
    .WithUsername("appuser")
    .WithPassword("secret123")
    .WithNetwork(network)
    .WithNetworkAliases("database")
    .Build();

// Create cache container
var cache = new RedisBuilder()
    .WithNetwork(network)
    .WithNetworkAliases("cache")
    .Build();

// Build custom application image
var appImage = new ImageFromDockerfileBuilder()
    .WithName("myapp:test")
    .WithDockerfileDirectory(CommonDirectoryPath.GetSolutionDirectory(), string.Empty)
    .WithDockerfile("Dockerfile")
    .WithBuildArgument("CONFIGURATION", "Release")
    .Build();

await appImage.CreateAsync();

// Create application container with dependencies
var app = new ContainerBuilder()
    .WithImage(appImage)
    .WithNetwork(network)
    .WithNetworkAliases("app")
    .WithPortBinding(8080, true)
    .WithEnvironment("ConnectionStrings__Database",
        "Host=database;Port=5432;Database=appdb;Username=appuser;Password=secret123")
    .WithEnvironment("ConnectionStrings__Redis", "cache:6379")
    .WithEnvironment("ASPNETCORE_URLS", "http://+:8080")
    .WithWaitStrategy(Wait.ForUnixContainer()
        .UntilHttpRequestIsSucceeded(r => r.ForPath("/health").ForPort(8080)))
    .DependsOn(database)
    .DependsOn(cache)
    .Build();

// Start containers in dependency order
await database.StartAsync();
Console.WriteLine($"Database ready: {database.GetConnectionString()}");

await cache.StartAsync();
Console.WriteLine("Cache ready");

await app.StartAsync();
var appUrl = $"http://{app.Hostname}:{app.GetMappedPublicPort(8080)}";
Console.WriteLine($"Application ready: {appUrl}");

// Run tests against the application
using var httpClient = new HttpClient { BaseAddress = new Uri(appUrl) };
var healthResponse = await httpClient.GetAsync("/health");
Console.WriteLine($"Health check: {healthResponse.StatusCode}");

var apiResponse = await httpClient.GetAsync("/api/data");
var data = await apiResponse.Content.ReadAsStringAsync();
Console.WriteLine($"API response: {data}");

// Cleanup in reverse order
await app.DisposeAsync();
await cache.DisposeAsync();
await database.DisposeAsync();
await network.DeleteAsync();
```

### Container Output Handling - Capturing logs

Captures and forwards container output (stdout/stderr) to various destinations for debugging and test validation.

```csharp
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;

// Forward container output to console
using IOutputConsumer outputConsumer = Consume.RedirectStdoutAndStderrToConsole();

var container = new ContainerBuilder()
    .WithImage("alpine:latest")
    .WithCommand("sh", "-c", "echo 'Starting...' && sleep 2 && echo 'Complete!'")
    .WithOutputConsumer(outputConsumer)
    .Build();

await container.StartAsync();
// Container output is automatically printed to console

// Wait for container to finish
await container.StopAsync();

// Retrieve logs programmatically
var (stdout, stderr) = await container.GetLogsAsync();
Console.WriteLine("=== STDOUT ===");
Console.WriteLine(stdout);
Console.WriteLine("=== STDERR ===");
Console.WriteLine(stderr);

// Get logs with timestamp and time range
var logsWithTime = await container.GetLogsAsync(
    since: DateTime.UtcNow.AddMinutes(-5),
    until: DateTime.UtcNow,
    timestampsEnabled: true);

await container.DisposeAsync();

// Custom output consumer for test validation
public class LogCollector : IOutputConsumer
{
    private readonly List<string> _logs = new();

    public IList<string> Logs => _logs.AsReadOnly();

    public Stream Stdout => Stream.Null;

    public Stream Stderr => Stream.Null;

    public bool Enabled => true;

    public void Dispose()
    {
    }

    public Task CopyAsync(byte[] buffer, int offset, int length, CancellationToken ct = default)
    {
        var message = System.Text.Encoding.UTF8.GetString(buffer, offset, length);
        _logs.Add(message);
        return Task.CompletedTask;
    }
}

var logCollector = new LogCollector();
var testContainer = new ContainerBuilder()
    .WithImage("myapp:test")
    .WithOutputConsumer(logCollector)
    .Build();

await testContainer.StartAsync();
await Task.Delay(5000); // Let it run

// Validate logs in tests
Assert.Contains("Application started", string.Join("", logCollector.Logs));

await testContainer.DisposeAsync();
```
