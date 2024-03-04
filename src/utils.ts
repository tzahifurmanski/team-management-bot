import { LogLevel } from "@slack/bolt";

export const getBoltLogLevel = (logLevel: any) => {
    let boltLogLevel;
  
    switch (logLevel) {
      case "error":
        boltLogLevel = LogLevel.ERROR;
        break;
      case "warn":
        boltLogLevel = LogLevel.WARN;
        break;
      case "debug":
        boltLogLevel = LogLevel.DEBUG;
        break;
      default:
        // Return INFO as default
        boltLogLevel = LogLevel.INFO;
        break;
    }
  
    return boltLogLevel;
  };


  export const handleListParameter = (
    param: string | undefined,
    defaultValue = "",
    delimiter = ",",
    removeEmpty = true,
  ): string[] => {
    // Check if we got a string that represents an array (or a default value that is an array)
    // If so, split it by the delimiter and optionally remove empty values.
    // Then, return the result
    const fieldContent = param || defaultValue;
  
    // Split by ,
    let result = fieldContent.split(delimiter);
    if (removeEmpty) {
      result = result.filter((i) => i);
    }
    return result;
  };
  