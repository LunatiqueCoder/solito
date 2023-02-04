import { useCallback, useState } from 'react'

import { useNavigation } from '../router/use-navigation'
import { useRoute } from './use-route'

type Config<
  Props extends Record<string, unknown>,
  Required extends boolean,
  ParsedType,
  InitialValue
> = (Required extends false
  ? {
      parse?: (value?: string | string[]) => ParsedType
    }
  : {
      parse: (value?: string | string[]) => ParsedType
    }) & {
  stringify?: (value: ParsedType) => string
  initial: InitialValue
  paramsToClearOnSetState?: (keyof Props)[]
}

type Params<
  Props extends Record<string, unknown> = Record<string, string>,
  Name extends keyof Props = keyof Props,
  NullableUnparsedParsedType extends Props[Name] | undefined =
    | Props[Name]
    | undefined,
  ParseFunction extends
    | undefined
    | ((
        value?: string | string[]
      ) => NonNullable<NullableUnparsedParsedType>) = (
    value?: string | string[]
  ) => NonNullable<NullableUnparsedParsedType>,
  InitialValue = NullableUnparsedParsedType | undefined,
  ParsedType = InitialValue extends undefined
    ? NullableUnparsedParsedType
    : ParseFunction extends undefined
    ? NullableUnparsedParsedType
    : NonNullable<NullableUnparsedParsedType>
> = NonNullable<ParsedType> extends string
  ?
      | [name: Name, config: Config<Props, false, ParsedType, InitialValue>]
      | [name: Name]
  : [name: Name, config: Config<Props, true, ParsedType, InitialValue>]

type Returns<
  Props extends Record<string, unknown> = Record<string, string>,
  Name extends keyof Props = keyof Props,
  NullableUnparsedParsedType extends Props[Name] | undefined =
    | Props[Name]
    | undefined,
  ParseFunction extends
    | undefined
    | ((
        value?: string | string[]
      ) => NonNullable<NullableUnparsedParsedType>) = (
    value?: string | string[]
  ) => NonNullable<NullableUnparsedParsedType>,
  InitialValue = NullableUnparsedParsedType | undefined,
  ParsedType = InitialValue extends undefined
    ? NullableUnparsedParsedType
    : ParseFunction extends undefined
    ? NullableUnparsedParsedType
    : NonNullable<NullableUnparsedParsedType>
> = readonly [
  state: ParsedType | InitialValue,
  setState: (value: ParsedType) => void
]

export function createParam<
  Props extends Record<string, unknown> = Record<string, string>
>() {
  function useParam<
    Name extends keyof Props,
    NullableUnparsedParsedType extends Props[Name] | undefined =
      | Props[Name]
      | undefined,
    ParseFunction extends
      | undefined
      | ((
          value?: string | string[]
        ) => NonNullable<NullableUnparsedParsedType>) = (
      value?: string | string[]
    ) => NonNullable<NullableUnparsedParsedType>,
    InitialValue = NullableUnparsedParsedType | undefined,
    ParsedType = InitialValue extends undefined
      ? NullableUnparsedParsedType
      : ParseFunction extends undefined
      ? NullableUnparsedParsedType
      : NonNullable<NullableUnparsedParsedType>
  >(
    ...[name, maybeConfig]: Params<
      Props,
      Name,
      NullableUnparsedParsedType,
      ParseFunction,
      InitialValue,
      ParsedType
    >
  ): Returns<
    Props,
    Name,
    NullableUnparsedParsedType,
    ParseFunction,
    InitialValue,
    ParsedType
  > {
    const { initial } = maybeConfig || {}
    const nativeRoute = useRoute()
    const nativeNavigation = useNavigation()
    const nativeStateFromParams = (nativeRoute?.params as any)?.[
      name
    ] as ParsedType

    const [nativeStateFromReact, setNativeStateFromReact] = useState<
      ParsedType | InitialValue
    >(() => nativeStateFromParams ?? (initial as InitialValue))

    const setNativeStateFromParams = useCallback((value: ParsedType) => {
      nativeNavigation?.setParams({
        [name]: value,
      })
    }, [])

    const nativeState = nativeRoute
      ? nativeStateFromParams
      : nativeStateFromReact
    const setNativeState = nativeRoute
      ? setNativeStateFromParams
      : setNativeStateFromReact

    if (!nativeRoute) {
      console.error(
        `[solito] useParam('${
          name as string
        }') called when there is no React Navigation route available. In a future version, this will throw an error. Please fix this by only calling useParam() inside of a React Navigation route. For now, Solito will fallback to using React state.`
      )
    }
    return [nativeState, setNativeState]
  }

  type UpdateOptions = {
    web?: {
      replace?: boolean
    }
  }

  function useUpdateParams(): (
    props: Partial<Props>,
    options?: UpdateOptions
  ) => void {
    const nativeNavigation = useNavigation()

    const setNativeStateFromParams = useCallback((value: Partial<Props>) => {
      nativeNavigation?.setParams(value)
    }, [])

    return setNativeStateFromParams
  }

  return {
    useParam,
    useUpdateParams,
  }
}
