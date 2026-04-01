using System.Security.Cryptography;
using System.Text;

namespace DroneManagement.Api.Application.Security;

public static class PasswordHasher
{
    public static string Hash(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    public static bool Verify(string password, string storedHash)
    {
        return Hash(password) == storedHash;
    }
}
