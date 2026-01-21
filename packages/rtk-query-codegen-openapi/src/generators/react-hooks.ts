import { getOperationName } from 'oazapfts/generate';
import ts from 'typescript';
import { getOverrides } from '../generate';
import type { ConfigFile, EndpointOverrides, OperationDefinition } from '../types';
import { capitalize, factory, isQuery } from '../utils/index';

type HooksConfigOptions = NonNullable<ConfigFile['hooks']>;

type GetReactHookNameParams = Omit<GenerateReactHooksParams, 'exportName' | 'operationDefinitions'> & {
  operationDefinition: OperationDefinition;
};

type CreateBindingParams = Pick<GetReactHookNameParams, 'operationDefinition' | 'operationNameSuffix'> & {
  overrides?: EndpointOverrides;

  /**
   * Indicates whether to generate a lazy query hook.
   *
   * @default false
   */
  isLazy?: boolean;
};

const createBinding = ({
  operationDefinition: { verb, path, operation },
  overrides,
  isLazy = false,
  operationNameSuffix,
}: CreateBindingParams): ts.BindingElement =>
  factory.createBindingElement(
    undefined,
    undefined,
    factory.createIdentifier(
      `use${isLazy ? 'Lazy' : ''}${capitalize(getOperationName(verb, path, operation.operationId))}${operationNameSuffix ?? ''}${
        isQuery(verb, overrides) ? 'Query' : 'Mutation'
      }`
    ),
    undefined
  );

const getReactHookName = ({
  operationDefinition,
  endpointOverrides,
  config,
  operationNameSuffix,
}: GetReactHookNameParams): ts.BindingElement | ts.BindingElement[] => {
  const overrides = getOverrides(operationDefinition, endpointOverrides);

  const baseParams = {
    operationDefinition,
    overrides,
    operationNameSuffix,
  } satisfies CreateBindingParams;

  const _isQuery = isQuery(operationDefinition.verb, overrides);

  // If `config` is true, just generate everything
  if (typeof config === 'boolean') {
    return createBinding(baseParams);
  }

  // `config` is an object and we need to check for the configuration of each property
  if (_isQuery) {
    return [
      ...(config.queries ? [createBinding(baseParams)] : []),
      ...(config.lazyQueries ? [createBinding({ ...baseParams, isLazy: true })] : []),
    ];
  }

  return config.mutations ? createBinding(baseParams) : [];
};

type GenerateReactHooksParams = Pick<ConfigFile, 'operationNameSuffix' | 'exportName'> & {
  /**
   * The name of the exported variable containing the generated hooks.
   *
   * @default "injectedRtkApi"
   */
  exportName: string;
  operationDefinitions: OperationDefinition[];
  endpointOverrides: EndpointOverrides[] | undefined;
  config: HooksConfigOptions;
};
export const generateReactHooks = ({
  exportName,
  operationDefinitions,
  endpointOverrides,
  config,
  operationNameSuffix,
}: GenerateReactHooksParams): ts.VariableStatement =>
  factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createObjectBindingPattern(
            operationDefinitions
              .map((operationDefinition) =>
                getReactHookName({ operationDefinition, endpointOverrides, config, operationNameSuffix })
              )
              .flat()
          ),
          undefined,
          undefined,
          factory.createIdentifier(exportName)
        ),
      ],
      ts.NodeFlags.Const
    )
  );
