import logging

app_logger = logging.getLogger("soil-tool")
app_logger.setLevel(logging.INFO)

# Setting to log level k will ignore all logs below k.
# DEBUG   (10)
# INFO    (20)
# WARNING (30)
# ERROR   (40)
# CRITICAL(50)


# Prevent duplicate logs if this module gets imported multiple times
if not app_logger.handlers:
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Consistent log formatting
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    console_handler.setFormatter(formatter)

    # Add handlers to logger
    app_logger.addHandler(console_handler)

# prevent log propagation to root logger
app_logger.propagate = False