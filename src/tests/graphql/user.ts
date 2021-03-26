import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from '../../server/validation/user';

export const meQuery = () => `
  {
    me {
      id
      email
      name
    }
  }
`;

export const registerMutation = (options: RegisterInput) => `
  mutation {
    register(options: {
      email: "${options.email}",
      name: "${options.name}",
      password: "${options.password}"
    }) {
      errors {
        field
        message
      }
      user {
        id
        email
        name
      }
    }
  }
`;

export const loginMutation = (options: LoginInput) => `
    mutation {
      login(options: {
      email: "${options.email}",
      password: "${options.password}"
      }) {
        errors {
          field
          message
        }
        user {
          id
          email
          name
        }
    }
  }
`;

export const logoutMutation = () => `
  mutation {
    logout
  }
`;

export const forgotPasswordMutation = (options: ForgotPasswordInput) => `
  mutation {
    forgotPassword(options: {
      email: "${options.email}"
    })
  }
`;

export const changePasswordMutation = (options: ChangePasswordInput) => `
mutation {
  changePassword(options: {
    token: "${options.token}",
    newPassword: "${options.newPassword}"
  }) {
    errors {
      field
      message
    }
    user {
      id
      email
      name
    }
  }
}
`;
