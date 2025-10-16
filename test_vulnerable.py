import os
def vulnerable_function():
    user_input = input('Enter command: ')
    os.system(user_input)
