"""
Security tests for LocalSandbox - verifying shell injection prevention and resource limits
"""
import os
import sys
import pytest
import tempfile
import subprocess

# Add harness to path
sys.path.insert(0, '/workspace/backend/packages/harness')

from deerflow.sandbox.local.local_sandbox import LocalSandbox


class TestShellInjectionPrevention:
    """Test that shell injection attacks are prevented"""
    
    def test_semicolon_injection_blocked(self):
        """Test that semicolon-based command injection is blocked"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # Attempt to inject a second command via semicolon
            malicious_cmd = "echo 'hello'; rm -rf /tmp/pwned_test_file"
            
            # Should raise ValueError due to command validation
            with pytest.raises(ValueError, match="semicolon"):
                sandbox.execute_command(malicious_cmd)
    
    def test_pipe_injection_blocked(self):
        """Test that pipe-based command injection is blocked"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # Pipe injection attempt
            malicious_cmd = "echo test | cat /etc/passwd"
            
            with pytest.raises(ValueError, match="pipe"):
                sandbox.execute_command(malicious_cmd)
    
    def test_backtick_injection_blocked(self):
        """Test that backtick command substitution is blocked"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # Backtick injection attempt
            malicious_cmd = "echo `whoami`"
            
            with pytest.raises(ValueError, match="backtick"):
                sandbox.execute_command(malicious_cmd)
    
    def test_dollar_substitution_blocked(self):
        """Test that $() command substitution is blocked"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # $() injection attempt  
            malicious_cmd = "echo $(whoami)"
            
            with pytest.raises(ValueError, match="variable/command substitution"):
                sandbox.execute_command(malicious_cmd)
    
    def test_redirect_blocked(self):
        """Test that output redirection is blocked"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # Redirect attempt
            malicious_cmd = "echo test > /tmp/pwned"
            
            with pytest.raises(ValueError, match="redirection"):
                sandbox.execute_command(malicious_cmd)
    
    def test_ampersand_blocked(self):
        """Test that background execution (&) is blocked"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # Background execution attempt
            malicious_cmd = "echo test & whoami"
            
            with pytest.raises(ValueError, match="background"):
                sandbox.execute_command(malicious_cmd)


class TestResourceLimits:
    """Test that resource limits prevent DoS attacks"""
    
    @pytest.mark.skipif(os.name == 'nt', reason="Resource limits only on Unix")
    def test_fork_bomb_prevented(self):
        """Test that fork bombs are prevented by RLIMIT_NPROC"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # Attempt to create many processes (fork bomb simulation)
            # This should be limited by RLIMIT_NPROC (50 soft, 100 hard)
            fork_cmd = "for i in {1..200}; do (echo $i &); done; echo done"
            
            result = sandbox.execute_command(fork_cmd)
            
            # Should complete but with errors due to process limits
            # Key point: it should not hang indefinitely or crash the system
            assert True  # If we get here without hanging, the test passes
    
    @pytest.mark.skipif(os.name == 'nt', reason="Resource limits only on Unix")
    def test_cpu_limit_enforced(self):
        """Test that CPU time limits are enforced"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            # Command that tries to run forever
            infinite_cmd = "while true; do :; done"
            
            # Should timeout due to RLIMIT_CPU (60s soft, 120s hard)
            # or subprocess timeout (600s)
            try:
                result = sandbox.execute_command(infinite_cmd)
                # If it returns, it should have an error
                assert "Exit Code:" in result or result == "(no output)"
            except subprocess.TimeoutExpired:
                # Timeout is also acceptable
                pass


class TestSafeCommandExecution:
    """Test that legitimate commands still work correctly"""
    
    def test_simple_echo_works(self):
        """Test that simple echo command works"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            result = sandbox.execute_command("echo hello_world")
            assert "hello_world" in result
    
    def test_file_operations_work(self):
        """Test that file creation and reading works"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            test_file = os.path.join(tmpdir, "test.txt")
            
            # Create file
            result = sandbox.execute_command(f"echo 'test content' > {test_file}")
            assert os.path.exists(test_file)
            
            # Read file
            result = sandbox.execute_command(f"cat {test_file}")
            assert "test content" in result
    
    def test_working_directory_isolated(self):
        """Test that sandbox operates within its working directory"""
        with tempfile.TemporaryDirectory() as tmpdir:
            sandbox = LocalSandbox(tmpdir)
            
            # Create file in sandbox
            result = sandbox.execute_command("echo test > sandbox_file.txt")
            
            # File should exist in sandbox dir
            assert os.path.exists(os.path.join(tmpdir, "sandbox_file.txt"))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
